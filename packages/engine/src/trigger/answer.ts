import { python } from '@trigger.dev/python'
import { logger, metadata, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { parsePyLogger, pyArgs, pyPath } from '../python/utils'

export const answer = schemaTask({
  id: 'answer',
  schema: z.object({
    question: z.string(),
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const streamingResult = python.stream.runScript(
      pyPath('answer'),
      pyArgs(payload),
    )

    // pass the streamingResult to the metadata system
    const stream = await metadata.stream('streamingResult', streamingResult)

    let text = ''

    for await (const chunk of stream) {
      const result = parsePyLogger<{ textDelta: string }>(chunk)?.message

      if (result && 'text_delta' in result) {
        text += result.text_delta
      }
    }

    return { response: text }
  },
})
