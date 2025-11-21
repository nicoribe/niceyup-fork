import { resumableStreamContext } from '@/lib/resumable-stream'
import { convertToModelMessages, validateUIMessages } from '@workspace/ai'
import { openai } from '@workspace/ai/providers'
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
        model: openai('gpt-5'),
        tools: {
          image_generation: openai.tools.imageGeneration(),
          retrieve_sources: retrieveSourcesTool({ namespace }),
        },
        signal: stopSignal.signal,
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

          console.log('AI assistant finished', { message })
        },
        onFailed: async ({ message, error }) => {
          enqueue(message)

          await queries.updateMessage({
            messageId: message.id,
            status: message.status,
            parts: message.parts,
            metadata: message.metadata,
          })

          console.log('AI assistant failed', { message, error })
        },
        onError: async ({ error }) => {
          await queries.updateMessage({
            messageId: assistantMessage.id,
            status: 'failed',
          })

          console.log('AI assistant error', { error })
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
