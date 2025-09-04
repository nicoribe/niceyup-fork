import type { AsyncIterableStream } from '@trigger.dev/core/v3'
import { python } from '@trigger.dev/python'
import { logger, metadata, schemaTask } from '@trigger.dev/sdk'
import { env } from '@workspace/env'
import { z } from 'zod'
import { parsePyLogger, pyArgs, pyPath } from '../../python/utils'

type AIMessageChunk = {
  id: string
  type: 'AIMessageChunk'
  content: string
}

export type STREAMS = {
  content: AsyncIterableStream<string>
}

async function* handleStreamingResult(
  streamingResult: AsyncIterableStream<string>,
): AsyncGenerator<string> {
  for await (const chunk of streamingResult) {
    const result = parsePyLogger<AIMessageChunk>(chunk)?.message

    if (result?.type === 'AIMessageChunk') {
      yield result.content
    }
  }
}

export const answerTask = schemaTask({
  id: 'answer',
  schema: z.object({
    question: z.string(),
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const args = {
      workspace_id: 'xxxx-xxxx-xxxx-xxxx',
      source_ids: ['yyyy-yyyy-yyyy-yyyy', 'xxxx-xxxx-xxxx-xxxx'],
      question: payload.question,
    }

    const streamingResult = python.stream.runScript(
      pyPath('answer'),
      pyArgs(args),
      {
        env: {
          PYTHON_ENV: env.NODE_ENV,
        },
      },
    )

    const stream = await metadata.stream(
      'content',
      handleStreamingResult(streamingResult),
    )

    let text = ''

    for await (const chunk of stream) {
      text += chunk
    }

    return { response: text }
  },
})
