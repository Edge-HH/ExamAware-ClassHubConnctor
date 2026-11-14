import { ref } from 'vue'

export interface RemoteCiStatus {
  status?: 'bound' | 'waiting' | 'error' | string
  serverUrl?: string
  className?: string
  classId?: string
  lastError?: string
  checkedAt?: string
}

export const remoteCiStatus = ref<RemoteCiStatus>({})

export function publishRemoteCiStatus(next: RemoteCiStatus) {
  remoteCiStatus.value = { ...next }
}

export function statusLabel(status?: string) {
  if (status === 'bound') return '已绑定'
  if (status === 'error') return '连接失败'
  return '等待连接'
}
