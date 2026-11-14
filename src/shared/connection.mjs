import path from 'node:path'

const EXAM_FILE = /^[a-f0-9]{32}\.ea2$/i

export function parseConnection(text) {
  let doc
  try {
    doc = JSON.parse(text)
  } catch {
    return null
  }
  if (!doc || typeof doc !== 'object') return null
  const serverUrl = normalizeServerUrl(doc.serverUrl ?? doc.CloudServerUrl)
  if (!serverUrl) return null
  const pairCode = stringOrEmpty(doc.pairCode ?? doc.PluginPairCode)
  const ticket = stringOrEmpty(doc.ticket)
  return {
    serverUrl,
    pairCode,
    ticket,
    classId: stringOrEmpty(doc.classId),
    className: stringOrEmpty(doc.className)
  }
}

export function isExamFileName(name) {
  return typeof name === 'string' && EXAM_FILE.test(name)
}

export function examFilePath(localAppData, localFileName) {
  if (!localAppData || !isExamFileName(localFileName)) return null
  return path.join(localAppData, 'RemoteCI', 'Exams', localFileName.toLowerCase())
}

export function connectionCandidates(env) {
  const local = env.LOCALAPPDATA
  const roaming = env.APPDATA
  const files = []
  if (local) {
    files.push(path.join(local, 'RemoteCI', 'connection.json'))
    files.push(path.join(local, 'ClassIsland', 'Plugins', 'RemoteCI.Plugin', 'Settings.json'))
    files.push(path.join(local, 'ClassIsland', 'Config', 'Plugins', 'RemoteCI', 'Settings.json'))
  }
  if (roaming) {
    files.push(path.join(roaming, 'ClassIsland', 'Plugins', 'RemoteCI.Plugin', 'Settings.json'))
  }
  return files
}

export async function loadConnection({ exists, readText, env }) {
  for (const file of connectionCandidates(env)) {
    try {
      if (!(await exists(file))) continue
      const parsed = parseConnection(await readText(file))
      if (parsed) return parsed
    } catch {
      // 下一处候选路径。
    }
  }
  return null
}

function normalizeServerUrl(value) {
  if (typeof value !== 'string') return ''
  const url = value.trim().replace(/\/+$/, '')
  if (!/^https?:\/\//i.test(url)) return ''
  return url
}

function stringOrEmpty(value) {
  return typeof value === 'string' ? value.trim() : ''
}
