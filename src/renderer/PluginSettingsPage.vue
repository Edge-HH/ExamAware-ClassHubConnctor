<template>
  <section class="remoteci-exam">
    <header>
      <h2>RemoteCI</h2>
      <span class="badge" :data-status="status.status || 'waiting'">{{ label }}</span>
    </header>
    <dl>
      <div>
        <dt>服务器</dt>
        <dd>{{ status.serverUrl || '还没有读到' }}</dd>
      </div>
      <div>
        <dt>班级</dt>
        <dd>{{ status.className || '尚未绑定' }}</dd>
      </div>
      <div>
        <dt>班级编号</dt>
        <dd>{{ status.classId || '—' }}</dd>
      </div>
      <div>
        <dt>最近检查</dt>
        <dd>{{ checkedAt }}</dd>
      </div>
    </dl>
    <p v-if="status.lastError" class="error">{{ status.lastError }}</p>
    <p v-else class="hint">连接信息来自本机 ClassIsland 上的 RemoteCI。绑定后会自动放映分发下来的考试。</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { remoteCiStatus, statusLabel } from './status'

const status = remoteCiStatus
const label = computed(() => statusLabel(status.value.status))
const checkedAt = computed(() => {
  const value = status.value.checkedAt
  if (!value) return '—'
  const time = new Date(value)
  return Number.isNaN(time.getTime()) ? value : time.toLocaleString()
})
</script>

<style scoped>
.remoteci-exam {
  display: grid;
  gap: 16px;
  max-width: 40rem;
}
header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
h2 {
  margin: 0;
  font-size: 1.25rem;
}
.badge {
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 0.85rem;
  background: #eef2f6;
}
.badge[data-status='bound'] {
  background: #e5f6ea;
}
.badge[data-status='error'] {
  background: #fde8e8;
}
dl {
  display: grid;
  gap: 10px;
  margin: 0;
}
dl div {
  display: grid;
  grid-template-columns: 6rem 1fr;
  gap: 12px;
}
dt {
  color: #667085;
}
dd {
  margin: 0;
  word-break: break-all;
}
.error {
  margin: 0;
  color: #b42318;
}
.hint {
  margin: 0;
  color: #667085;
}
</style>
