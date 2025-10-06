import {
  AbortTaskRunError,
  logger,
  metadata,
  schemaTask,
} from '@trigger.dev/sdk'
import {
  convertToModelMessages,
  streamText,
  validateUIMessages,
} from '@workspace/ai'
import { openai } from '@workspace/ai/providers'
import type { AIMessage } from '@workspace/ai/types'
import { readAIMessageStream } from '@workspace/ai/utils'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

export type STREAMS = {
  [K in 'message-start' | 'message-delta' | 'message-end']: AIMessage
}

async function* toStream(message: AIMessage) {
  yield message
}

export const answerMessageTask = schemaTask({
  id: 'answer-message',
  retry: {
    maxAttempts: 1,
  },
  schema: z.object({
    conversationId: z.string(),
    questionMessageId: z.string(),
    answerMessageId: z.string(),
  }),
  run: async (payload, { signal }) => {
    const questionMessage = await queries.getMessage({
      messageId: payload.questionMessageId,
    })

    if (!questionMessage) {
      throw new AbortTaskRunError('Question message not found')
    }

    const contextMessages = true // TODO: Make this configurable
    const maxContextMessages = 10 // TODO: Make this configurable

    const messageHistory = await queries.listMessages({
      conversationId: payload.conversationId,
      targetMessageId: questionMessage.id,
      parents: contextMessages, // Get the context messages
      children: false, // Not needed, only parents are used
      parentsLimit: maxContextMessages, // Limit the number of context messages
    })

    const validatedMessages = await validateUIMessages({
      messages: [...messageHistory, questionMessage],
    })

    const messages = convertToModelMessages(validatedMessages)

    let error: unknown

    await queries.updateMessage({
      messageId: payload.answerMessageId,
      status: 'in_progress',
    })

    const streamingResult = streamText({
      model: openai('gpt-5'),
      tools: {
        image_generation: openai.tools.imageGeneration(),
      },
      messages,
      abortSignal: signal,
      onError: (event) => {
        error = event.error
      },
    })

    let message = {
      id: payload.answerMessageId,
      status: 'in_progress',
      role: 'assistant',
      parts: [],
    } as AIMessage

    await metadata.stream('message-start', toStream(message))

    const stream = await metadata.stream(
      'message-delta',
      readAIMessageStream({ message, stream: streamingResult }),
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

      await queries.updateMessage({
        messageId: message.id,
        status: message.status,
        parts: message.parts,
        metadata: message.metadata,
      })

      await metadata.stream('message-end', toStream(message))

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

    await queries.updateMessage({
      messageId: message.id,
      status: message.status,
      parts: message.parts,
      metadata: message.metadata,
    })

    await metadata.stream('message-end', toStream(message))

    logger.warn('Streaming result', {
      message,
      streamingResult,
    })

    return { message }
  },
})
