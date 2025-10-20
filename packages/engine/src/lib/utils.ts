import path from 'node:path'
import { env } from './env'

export function tmpDir(...paths: string[]): string {
  const rootPath = '/tmp/.niceyup-engine' as const

  if (env.APP_ENV === 'development') {
    return path.join('./', rootPath, ...paths)
  }

  return path.join(rootPath, ...paths)
}
