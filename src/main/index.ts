import { createHash } from 'node:crypto'
import { defineMainPlugin, type MainPluginContext } from '@dsz-examaware/plugin-sdk'
import { examFilePath, loadConnection, type ConnectionDocument } from '../shared/connection.mjs'

interface RemoteCiSettings {
  status?: 'bound' | 'waiting' | 'error'
  agentToken?: string
  serverUrl?: string
  className?: string
  classId?: string
  lastError?: string
  checkedAt?: string
  startedJobIds?: string[]
}

interface ExamJob {
  id: string
  fileName: string
  sha256: string
  localFileName: string
  state: string
}

const POLL_MS = 15_000

export default defineMainPlugin<RemoteCiSettings>({
  activate(ctx) {
    let stopped = false
    const tick = async () => {
      if (stopped) return
      try {
        const connection = await loadConnection({
          env: process.env,
          exists: (file) => ctx.api.files.exists(file),
          readText: (file) => ctx.api.files.readText(file)
        })
        if (!connection) {
          await remember(ctx, {
            status: 'waiting',
            lastError: '还没有读到 ClassIsland 上的 RemoteCI 连接信息',
            checkedAt: new Date().toISOString()
          })
          return
        }
        const settings = ctx.api.settings.get()
        const token = settings.serverUrl === connection.serverUrl ? settings.agentToken : undefined
        const agentToken = token || await bind(ctx, connection)
        if (!agentToken || stopped) return
        await playPending(ctx, connection.serverUrl, agentToken)
      } catch (error) {
        const message = describeError(error, ctx.api.settings.get().serverUrl)
        ctx.logger.warn(message)
        await remember(ctx, {
          status: 'error',
          lastError: message,
          checkedAt: new Date().toISOString()
        })
      }
    }
    const timer = setInterval(() => {
      void tick()
    }, POLL_MS)
    ctx.scope.defer(() => {
      stopped = true
      clearInterval(timer)
    })
    void tick()
    ctx.logger.info('RemoteCI 考试插件已启动')
  }
})

async function bind(ctx: MainPluginContext<RemoteCiSettings>, connection: ConnectionDocument) {
  if (!connection.ticket && !connection.pairCode) {
    throw new Error('RemoteCI 已连接，但还没有绑定票据。请确认教室插件在线。')
  }
  const response = await ctx.api.network.post(`${connection.serverUrl}/api/exam/bind`, {
    ticket: connection.ticket || undefined,
    pairCode: connection.pairCode || undefined,
    deviceName: 'ExamAware'
  }, { allowLocalNetwork: true, timeoutMs: 10_000 })
  if (!response.ok) throw new Error(`绑定失败（${response.status}）`)
  const body = response.json<{ token?: string; className?: string; classId?: string }>()
  if (!body.token) throw new Error('绑定响应缺少令牌')
  await remember(ctx, {
    status: 'bound',
    agentToken: body.token,
    serverUrl: connection.serverUrl,
    className: body.className ?? connection.className,
    classId: body.classId ?? connection.classId,
    lastError: '',
    checkedAt: new Date().toISOString()
  })
  ctx.logger.info(`已绑定班级 ${body.className || connection.className || ''}`.trim())
  return body.token
}

async function playPending(ctx: MainPluginContext<RemoteCiSettings>, serverUrl: string, token: string) {
  const response = await ctx.api.network.get(`${serverUrl}/api/exam/jobs`, {
    headers: { Authorization: `Bearer ${token}` },
    allowLocalNetwork: true,
    timeoutMs: 10_000
  })
  if (response.status === 401) {
    await remember(ctx, { agentToken: '' })
    return
  }
  if (!response.ok) throw new Error(`读取考试任务失败（${response.status}）`)
  const body = response.json<{ jobs?: ExamJob[] }>()
  const localAppData = process.env.LOCALAPPDATA
  if (!localAppData) return
  const started = new Set(ctx.api.settings.get().startedJobIds ?? [])
  for (const job of body.jobs ?? []) {
    if (started.has(job.id)) {
      await ack(ctx, serverUrl, token, job.id, 'started', '已经放映')
      continue
    }
    const file = examFilePath(localAppData, job.localFileName)
    if (!file || !(await ctx.api.files.exists(file))) continue
    const bytes = await ctx.api.files.readBytes(file)
    const digest = createHash('sha256').update(bytes).digest('hex')
    if (digest.toLowerCase() !== job.sha256.toLowerCase()) {
      await ack(ctx, serverUrl, token, job.id, 'failed', '考试档案校验不一致')
      continue
    }
    try {
      await ctx.api.player.startFromFile(file)
      started.add(job.id)
      await remember(ctx, { startedJobIds: [...started].slice(-100), lastError: '' })
      await ack(ctx, serverUrl, token, job.id, 'started', job.fileName)
      ctx.logger.info(`已放映 ${job.fileName}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : '放映失败'
      await ack(ctx, serverUrl, token, job.id, 'failed', message)
    }
  }
}

async function ack(
  ctx: MainPluginContext<RemoteCiSettings>,
  serverUrl: string,
  token: string,
  jobId: string,
  state: 'started' | 'failed',
  message: string
) {
  await ctx.api.network.post(`${serverUrl}/api/exam/jobs/${jobId}/ack`, { state, message }, {
    headers: { Authorization: `Bearer ${token}` },
    allowLocalNetwork: true,
    timeoutMs: 10_000
  })
}

async function remember(ctx: MainPluginContext<RemoteCiSettings>, patch: Partial<RemoteCiSettings>) {
  await ctx.api.settings.patch(patch)
}

function describeError(error: unknown, serverUrl?: string) {
  const message = error instanceof Error ? error.message : '绑定失败'
  if (message === 'fetch failed' || message === 'Failed to fetch') {
    return serverUrl ? `无法连接 ${serverUrl}` : '无法连接 RemoteCI 服务器'
  }
  return message
}
