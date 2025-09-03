import { AbortTaskRunError, metadata, schemaTask } from '@trigger.dev/sdk'
import {
  convertToModelMessages,
  streamText,
  validateUIMessages,
} from '@workspace/ai'
import { gateway } from '@workspace/ai/gateway'
import type { AIMessage } from '@workspace/ai/types'
import { readAIMessageStream } from '@workspace/ai/utils'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

export type STREAMS = {
  messageStream: AIMessage
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
  init: async ({ payload }) => {
    const conversation = await queries.getConversation({
      conversationId: payload.conversationId,
    })

    if (!conversation) {
      throw new AbortTaskRunError('Conversation not found')
    }

    const questionMessage = await queries.getMessage({
      messageId: payload.questionMessageId,
    })

    if (!questionMessage) {
      throw new AbortTaskRunError('Question message not found')
    }

    const answerMessage = await queries.getMessage({
      messageId: payload.answerMessageId,
    })

    if (!answerMessage) {
      throw new AbortTaskRunError('Answer message not found')
    }

    return { questionMessage, answerMessage }
  },
  run: async (payload, { init, signal }) => {
    const { questionMessage, answerMessage } = init!

    await queries.updateMessage({
      messageId: answerMessage.id,
      status: 'in_progress',
    })

    const parentsLimit = 10 // TODO: Make this configurable

    const messageHistory = await queries.listMessages({
      conversationId: payload.conversationId,
      targetMessageId: questionMessage.id,
      parents: true, // Get the parents of the question message
      children: false, // Only get the parents, not the children
      parentsLimit, // Limit the number of parents to 10
    })

    const validatedMessages = await validateUIMessages({
      messages: [...messageHistory, questionMessage],
    })

    const messages = convertToModelMessages(validatedMessages)

    let error: unknown

    const streamingResult = streamText({
      model: gateway.languageModel('openai/gpt-5'),
      messages,
      abortSignal: signal,
      onError: (event) => {
        error = event.error
      },
    })

    let message = {
      id: answerMessage.id,
      status: 'in_progress',
      role: 'assistant',
      parts: [],
    } as AIMessage

    const stream = await metadata.stream(
      'messageStream',
      readAIMessageStream({ message, stream: streamingResult }),
    )

    for await (const chunk of stream) {
      message = chunk
    }

    if (error) {
      throw error
    }

    message.status = signal.aborted ? 'stopped' : 'finished'

    await queries.updateMessage({
      messageId: message.id,
      status: message.status,
      parts: message.parts,
      metadata: message.metadata,
    })

    return { message }
  },
  onFailure: async ({ init, error }) => {
    const answerMessage = init?.answerMessage

    if (answerMessage) {
      await queries.updateMessage({
        messageId: answerMessage.id,
        status: 'failed',
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      })
    }
  },
})
