import assert from 'node:assert/strict'
import test from 'node:test'
import { examFilePath, isExamFileName, loadConnection, parseConnection } from './connection.mjs'

test('parseConnection reads the file published by RemoteCI', () => {
  const parsed = parseConnection(JSON.stringify({
    serverUrl: 'http://nas:8080/',
    pairCode: 'class-pair-code',
    ticket: 'ticket-1',
    classId: 'class-1',
    className: '高一(1)班'
  }))
  assert.equal(parsed?.serverUrl, 'http://nas:8080')
  assert.equal(parsed?.ticket, 'ticket-1')
  assert.equal(parsed?.className, '高一(1)班')
})

test('parseConnection accepts ClassIsland Settings.json field names', () => {
  const parsed = parseConnection(JSON.stringify({
    CloudServerUrl: 'https://school.example/remoteci',
    PluginPairCode: 'persistent-code'
  }))
  assert.equal(parsed?.serverUrl, 'https://school.example/remoteci')
  assert.equal(parsed?.pairCode, 'persistent-code')
  assert.equal(parsed?.ticket, '')
})

test('parseConnection rejects a missing or non-http server', () => {
  assert.equal(parseConnection('{}'), null)
  assert.equal(parseConnection(JSON.stringify({ serverUrl: 'file:///tmp' })), null)
  assert.equal(parseConnection('not-json'), null)
})

test('exam file names stay inside the exams directory', () => {
  assert.equal(isExamFileName('a'.repeat(32) + '.ea2'), true)
  assert.equal(isExamFileName('../secret.ea2'), false)
  assert.equal(examFilePath('C:\\Users\\room\\AppData\\Local', 'abc.ea2'), null)
  const name = '0123456789abcdef0123456789abcdef.ea2'
  assert.equal(
    examFilePath('C:\\Users\\room\\AppData\\Local', name),
    'C:\\Users\\room\\AppData\\Local\\RemoteCI\\Exams\\' + name
  )
})

test('loadConnection prefers the published connection file', async () => {
  const files = new Map([
    ['C:\\Local\\RemoteCI\\connection.json', JSON.stringify({ serverUrl: 'http://nas:8080', ticket: 't' })],
    ['C:\\Local\\ClassIsland\\Plugins\\RemoteCI.Plugin\\Settings.json', JSON.stringify({ CloudServerUrl: 'http://old', PluginPairCode: 'old' })]
  ])
  const loaded = await loadConnection({
    env: { LOCALAPPDATA: 'C:\\Local', APPDATA: 'C:\\Roaming' },
    exists: async (file) => files.has(file),
    readText: async (file) => files.get(file)
  })
  assert.equal(loaded?.serverUrl, 'http://nas:8080')
  assert.equal(loaded?.ticket, 't')
})
