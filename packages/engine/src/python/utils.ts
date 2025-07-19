import { logger } from '@trigger.dev/sdk'

export function pyPath(filePath: string): string {
  return `python/${filePath}.py`
}

export function pyArgs(args: Record<string, unknown>): string[] {
  return [JSON.stringify(args)]
}

type PyLogger<TResult> = {
  asctime: string
  name: string
  levelname: string
  message: TResult
}

// TODO: Add this to the logger
// const pyLevelName = {
//   CRITICAL: 'CRITICAL',
//   ERROR: 'ERROR',
//   WARNING: 'WARNING',
//   INFO: 'INFO',
//   DEBUG: 'DEBUG',
//   NOTSET: 'NOTSET',
// } as const

export function parsePyLogger<TResult>(
  pyLogger: string,
  { log }: { log?: false } = {},
): Partial<PyLogger<TResult>> {
  const regex = /^(.+?) - (.+?) - (.+?) - (.+)$/
  const match = pyLogger.match(regex)

  if (!match) {
    return {}
  }

  const [, asctime, name, levelname, message] = match

  if (log !== false && message) {
    try {
      const parsed = JSON.parse(message)

      logger.info(parsed?.message || parsed, parsed)

      return { asctime, name, levelname, message: parsed }
    } catch {
      logger.info(message)
    }
  }

  return { asctime, name, levelname, message } as Partial<PyLogger<TResult>>
}

type AsyncIterableStream<T> = AsyncIterable<T> & ReadableStream<T>

export async function pyStreamingResult<TResult>(
  streamingResult: AsyncIterableStream<string>,
  { log, index }: { log?: false; index?: number } = {},
): Promise<TResult> {
  const results = []

  for await (const chunk of streamingResult) {
    results.push(parsePyLogger(chunk, { log }))
  }

  if (!results.length) {
    return undefined as TResult
  }

  if (index !== undefined) {
    return results[index]?.message as TResult
  }

  if (results.length > 2) {
    return results[results.length - 2]?.message as TResult
  }

  return results[results.length - 1]?.message as TResult
}
