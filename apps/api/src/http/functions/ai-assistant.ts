import { resumableStreamContext } from '@/lib/resumable-stream'
import {
  convertToModelMessages,
  stepCountIs,
  validateUIMessages,
} from '@workspace/ai'
import { gateway, openai } from '@workspace/ai/providers'
import type {
  AIMessage,
  AIMessageMetadata,
  AIMessagePart,
} from '@workspace/ai/types'
import { queries } from '@workspace/db/queries'
import { retrieveSourcesTool, streamAIAssistant } from '@workspace/engine'
import throttle from 'throttleit'

export async function sendUserMessageToAssistant({
  namespace,
  conversationId,
  userMessage,
  assistantMessage,
  agentConfiguration,
}: {
  namespace: string
  conversationId: string
  userMessage: {
    id: string
    parts: AIMessagePart[]
  }
  assistantMessage: {
    id: string
    metadata?: AIMessageMetadata | null
  }
  agentConfiguration?: {
    languageModel?: string
    contextMessages?: boolean
    maxContextMessages?: number
  }
}) {
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (chunk: AIMessage) =>
        controller.enqueue(`${JSON.stringify(chunk)}\n\n`)

      enqueue({
        id: assistantMessage.id,
        metadata: assistantMessage.metadata ?? undefined,
        status: 'queued',
        role: 'assistant',
        parts: [],
      })

      const messageHistory = agentConfiguration?.contextMessages
        ? await queries.listMessageParentNodes({
            conversationId,
            targetMessageId: userMessage.id,
            limit: agentConfiguration?.maxContextMessages,
          })
        : []

      const validatedMessages = await validateUIMessages({
        messages: [...messageHistory, { ...userMessage, role: 'user' }],
      })

      const messages = convertToModelMessages(validatedMessages)

      const stopSignal = new AbortController()

      // throttle reading from chat store to max once per second
      const checkStopSignal = throttle(async () => {
        const message = await queries.getMessage({
          messageId: assistantMessage.id,
        })

        if (message?.status === 'stopped') {
          stopSignal.abort()
        }
      }, 1000)

      await streamAIAssistant({
        model: gateway.languageModel(
          agentConfiguration?.languageModel || 'openai/gpt-4.1',
        ),
        tools: {
          image_generation: openai.tools.imageGeneration(),
          retrieve_sources: retrieveSourcesTool({ namespace }),
        },
        stopWhen: stepCountIs(5),
        abortSignal: stopSignal.signal,
        originalMessage: assistantMessage,
        messages,
        onStart: async ({ message }) => {
          enqueue(message)

          await queries.updateMessage({
            messageId: message.id,
            status: message.status,
          })
        },
        onChunk: async ({ message }) => {
          enqueue(message)

          checkStopSignal()
        },
        onFinish: async ({ message }) => {
          enqueue(message)

          await queries.updateMessage({
            messageId: message.id,
            status: message.status,
            parts: message.parts,
            metadata: message.metadata,
          })
        },
        onFailed: async ({ message }) => {
          enqueue(message)

          await queries.updateMessage({
            messageId: message.id,
            status: message.status,
            parts: message.parts,
            metadata: message.metadata,
          })
        },
        onError: async () => {
          await queries.updateMessage({
            messageId: assistantMessage.id,
            status: 'failed',
          })
        },
      })

      controller.close()
    },
  })

  await resumableStreamContext.createNewResumableStream(
    assistantMessage.id,
    () => stream,
  )
}
