import { python } from '@trigger.dev/python'
import { logger, metadata, schemaTask } from '@trigger.dev/sdk'
import { env } from '@workspace/env'
import { z } from 'zod'
import { parsePyLogger, pyArgs, pyPath } from '../python/utils'

type AIMessageChunk = {
  id: string
  type: 'AIMessageChunk'
  content: string
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
      source_ids: ['xxxx-xxxx-xxxx-xxxx'],
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

    // pass the streamingResult to the metadata system
    const stream = await metadata.stream('streamingResult', streamingResult)

    let text = ''

    for await (const chunk of stream) {
      const result = parsePyLogger<AIMessageChunk>(chunk)?.message

      if (result?.type === 'AIMessageChunk') {
        text += result.content
      }
    }

    return { response: text }
  },
})
