import { randomUUID } from 'node:crypto'
import {
  AbortTaskRunError,
  logger,
  metadata,
  schemaTask,
} from '@trigger.dev/sdk'
import { readUIMessageStream, stepCountIs, streamText } from '@workspace/ai'
import { openai } from '@workspace/ai/providers'
import type { AIMessage } from '@workspace/ai/types'
import { z } from 'zod'
import { GetInformationTool } from '../../../functions/ai-tools'
import { templatePromptAnswer } from '../../../functions/prompts'

export const aiAgentTask = schemaTask({
  id: 'ai-agent',
  retry: {
    maxAttempts: 1,
  },
  schema: z.object({
    ownerUserId: z.string(),
    question: z.string(),
  }),
  run: async (payload, { signal }) => {
    let error: unknown

    const streamingResult = streamText({
      model: openai('gpt-5'),
      tools: {
        get_information: GetInformationTool({ namespace: payload.ownerUserId }),
      },
      stopWhen: stepCountIs(5),
      messages: templatePromptAnswer({ question: payload.question }),
      abortSignal: signal,
      onError: (event) => {
        error = event.error
      },
    })

    let message = {
      id: randomUUID(),
      status: 'processing',
      role: 'assistant',
      parts: [],
    } as AIMessage

    const stream = await metadata.stream(
      'message-delta',
      readUIMessageStream<AIMessage>({
        message,
        stream: streamingResult.toUIMessageStream<AIMessage>({
          sendReasoning: true,
          sendSources: true,
        }),
      }),
    )

    for await (const chunk of stream) {
      message = chunk
    }

    if (error) {
      message.status = 'failed'
      message.metadata = {
        ...message.metadata,
        error: error instanceof Error ? error.message : String(error),
      }

      logger.error('Error streaming result', {
        error,
        message,
        streamingResult,
      })

      throw new AbortTaskRunError(
        error instanceof Error ? error.message : String(error),
      )
    }

    message.status = signal.aborted ? 'stopped' : 'finished'

    logger.warn('Streaming result', {
      message,
      streamingResult,
    })

    return { message }
  },
})
