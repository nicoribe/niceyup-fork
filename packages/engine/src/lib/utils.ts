import { logger } from '@trigger.dev/sdk'

export function pyPath(filePath: string): string {
  return `src/python/${filePath}`
}

export function pyArgs(args: Record<string, unknown>): string[] {
  return [JSON.stringify(args)]
}

type PyLogger = {
  asctime: string
  name: string
  levelname: string
  message: unknown
}

export function parsePyLogger(pyLogger: string): Partial<PyLogger> {
  const regex = /^(.+?) - (.+?) - (.+?) - (.+)$/
  const match = pyLogger.match(regex)

  if (!match) {
    return {}
  }

  const [, asctime, name, levelname, message] = match

  if (message) {
    try {
      const parsed = JSON.parse(message)
      logger.info(parsed?.message || parsed, parsed)
    } catch {
      logger.info(message)
    }
  }

  return { asctime, name, levelname, message }
}
