import {
  AbortTaskRunError,
  logger,
  metadata,
  schemaTask,
} from '@trigger.dev/sdk'
import { stepCountIs, streamText, tool } from '@workspace/ai'
import { openai } from '@workspace/ai/providers'
import type { AIMessage } from '@workspace/ai/types'
import { readAIMessageStream } from '@workspace/ai/utils'
import { z } from 'zod'
import { findRelevantContent } from '../../lib/ai'

export const aiAgentTask = schemaTask({
  id: 'ai-agent',
  retry: {
    maxAttempts: 1,
  },
  schema: z.object({
    question: z.string(),
  }),
  run: async (payload, { signal }) => {
    let error: unknown

    const streamingResult = streamText({
      model: openai('gpt-5'),
      tools: {
        get_information: tool({
          description:
            'Get information from your knowledge base to answer questions.',
          inputSchema: z.object({
            question: z.string().describe('The users question.'),
          }),
          execute: async ({ question }) =>
            logger.trace('Get Information Tool', () =>
              findRelevantContent(question),
            ),
        }),
      },
      stopWhen: stepCountIs(5),
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant. Check your knowledge base before answering any questions.
          Only respond to questions using information from tool calls.
          if no relevant information is found in the tool calls, respond, "Sorry, I don't know."`,
        },
        {
          role: 'user',
          content: payload.question,
        },
      ],
      abortSignal: signal,
      onError: (event) => {
        error = event.error
      },
    })

    let message = {
      id: crypto.randomUUID(),
      status: 'in_progress',
      role: 'assistant',
      parts: [],
    } as AIMessage

    const stream = await metadata.stream(
      'message-delta',
      readAIMessageStream({ message, stream: streamingResult as any }),
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
