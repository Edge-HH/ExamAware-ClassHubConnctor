export interface ConnectionDocument {
  serverUrl: string
  pairCode: string
  ticket: string
  classId: string
  className: string
}

export interface ConnectionIo {
  exists(file: string): Promise<boolean>
  readText(file: string): Promise<string>
  env: NodeJS.ProcessEnv
}

export function parseConnection(text: string): ConnectionDocument | null
export function isExamFileName(name: string): boolean
export function examFilePath(localAppData: string, localFileName: string): string | null
export function connectionCandidates(env: NodeJS.ProcessEnv): string[]
export function loadConnection(io: ConnectionIo): Promise<ConnectionDocument | null>
