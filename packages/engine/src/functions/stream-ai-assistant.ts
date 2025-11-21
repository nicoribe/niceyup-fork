import { randomUUID } from 'node:crypto'
import {
  type ModelMessage,
  type ToolSet,
  readUIMessageStream,
  stepCountIs,
  streamText,
} from '@workspace/ai'
import type { LanguageModel } from '@workspace/ai'
import type { AIMessage, AIMessageMetadata } from '@workspace/ai/types'

export async function streamAIAssistant({
  model,
  tools,
  signal,
  originalMessage,
  messages,
  onStart,
  onChunk,
  onFinish,
  onFailed,
  onError,
}: {
  model: LanguageModel
  tools?: ToolSet
  messages: ModelMessage[]
  signal?: AbortSignal
  originalMessage?: {
    id?: string
    metadata?: AIMessageMetadata | null
  }
  onStart?: (event: { message: AIMessage }) => Promise<void>
  onChunk?: (event: { message: AIMessage }) => Promise<void>
  onFinish?: (event: { message: AIMessage }) => Promise<void>
  onFailed?: (event: { message: AIMessage; error: unknown }) => Promise<void>
  onError?: (event: { error: unknown }) => void
}) {
  try {
    let error: unknown

    let message = {
      id: originalMessage?.id || randomUUID(),
      metadata: originalMessage?.metadata || {},
      status: 'processing',
      role: 'assistant',
      parts: [],
    } as AIMessage

    await onStart?.({ message })

    const streamingResult = streamText({
      model,
      tools,
      stopWhen: stepCountIs(5),
      messages,
      abortSignal: signal,
      onError: (event) => {
        error = event.error
      },
    })

    const messageStream = readUIMessageStream<AIMessage>({
      message,
      stream: streamingResult.toUIMessageStream<AIMessage>({
        sendReasoning: true,
        sendSources: true,
        messageMetadata: () => {
          return originalMessage?.metadata || {}
        },
      }),
    })

    for await (const chunk of messageStream) {
      message = chunk
      await onChunk?.({ message })
    }

    if (error) {
      message.status = 'failed'
      message.metadata = {
        ...message.metadata,
        error: error instanceof Error ? error.message : String(error),
      }

      await onFailed?.({ message, error })
    } else {
      message.status = signal?.aborted ? 'stopped' : 'finished'

      await onFinish?.({ message })
    }

    return streamingResult
  } catch (error) {
    onError?.({ error })
  }
}
