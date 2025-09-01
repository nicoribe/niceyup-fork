import { metadata, schemaTask } from '@trigger.dev/sdk'
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
    const questionMessage = await queries.getMessage({
      messageId: payload.questionMessageId,
    })

    if (!questionMessage) {
      throw new Error('Question message not found')
    }

    const answerMessage = await queries.getMessage({
      messageId: payload.answerMessageId,
    })

    if (!answerMessage) {
      throw new Error('Answer message not found')
    }

    return { questionMessage, answerMessage }
  },
  run: async (payload, { init, signal }) => {
    const { questionMessage, answerMessage } = init!

    await queries.updateMessage({
      messageId: answerMessage.id,
      status: 'in_progress',
    })

    const messageHistory = payload.conversationId
      ? await queries.listMessages({
          conversationId: payload.conversationId,
          targetMessageId: questionMessage.id,
          parents: true,
        })
      : []

    const validatedMessages = await validateUIMessages({
      messages: [...messageHistory, questionMessage],
    })

    const messages = convertToModelMessages(validatedMessages)

    const streamingResult = streamText({
      model: gateway.languageModel('openai/gpt-3.5-turbo'),
      messages,
      abortSignal: signal,
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
