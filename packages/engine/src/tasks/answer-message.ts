import { AbortTaskRunError, logger, schemaTask } from '@trigger.dev/sdk'
import { convertToModelMessages, validateUIMessages } from '@workspace/ai'
import { openai } from '@workspace/ai/providers'
import type { AIMessage } from '@workspace/ai/types'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'
import {
  type StreamEventKey,
  streamAIAssistant,
} from '../functions/stream-ai-assistant'

export type STREAMS = {
  [K in StreamEventKey]: AIMessage
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

    // TODO: Make this dynamic based on the agent's configuration
    const contextMessages = true
    const maxContextMessages = 10

    const messageHistory = contextMessages
      ? await queries.listMessageParentNodes({
          conversationId: payload.conversationId,
          targetMessageId: questionMessage.id,
          limit: maxContextMessages,
        })
      : []

    const validatedMessages = await validateUIMessages({
      messages: [...messageHistory, questionMessage],
    })

    const messages = convertToModelMessages(validatedMessages)

    const streamingResult = await streamAIAssistant({
      model: openai('gpt-5'),
      tools: {
        image_generation: openai.tools.imageGeneration(),
      },
      messages,
      signal,
      messageId: payload.answerMessageId,
      onStart: async ({ message }) => {
        await queries.updateMessage({
          messageId: message.id,
          status: message.status,
        })
      },
      onFinish: async ({ message }) => {
        await queries.updateMessage({
          messageId: message.id,
          status: message.status,
          parts: message.parts,
          metadata: message.metadata,
        })

        logger.warn('AI assistant finished', { message })
      },
      onFailed: async ({ message, error }) => {
        await queries.updateMessage({
          messageId: message.id,
          status: message.status,
          parts: message.parts,
          metadata: message.metadata,
        })

        logger.error('AI assistant failed', { message, error })
      },
      onError: async ({ error }) => {
        await queries.updateMessage({
          messageId: payload.answerMessageId,
          status: 'failed',
        })

        throw error
      },
    })

    return streamingResult
  },
})
