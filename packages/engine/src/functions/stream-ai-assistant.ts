import { randomUUID } from 'node:crypto'
import { metadata } from '@trigger.dev/sdk'
import {
  type ModelMessage,
  type ToolSet,
  readUIMessageStream,
  stepCountIs,
  streamText,
} from '@workspace/ai'
import type { LanguageModel } from '@workspace/ai'
import type { AIMessage } from '@workspace/ai/types'

async function* toStream(message: AIMessage) {
  yield message
}

export type StreamEventKey = 'message-start' | 'message-delta' | 'message-end'

export async function streamAIAssistant({
  model,
  tools,
  messages,
  signal,
  messageId,
  onStart,
  onFinish,
  onFailed,
  onError,
}: {
  model: LanguageModel
  tools?: ToolSet
  messages: ModelMessage[]
  signal: AbortSignal
  messageId?: string
  onStart?: (event: { message: AIMessage }) => Promise<void>
  onFinish?: (event: { message: AIMessage }) => Promise<void>
  onFailed?: (event: { message: AIMessage; error: unknown }) => Promise<void>
  onError?: (event: { error: unknown }) => void
}) {
  try {
    let error: unknown

    let message = {
      id: messageId || randomUUID(),
      status: 'processing',
      role: 'assistant',
      parts: [],
    } as AIMessage

    await Promise.all([
      onStart?.({ message }),
      metadata.stream('message-start', toStream(message)),
    ])

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
      }),
    })

    const stream = await metadata.stream('message-delta', messageStream)

    for await (const chunk of stream) {
      message = chunk
    }

    if (error) {
      message.status = 'failed'
      message.metadata = {
        ...message.metadata,
        error: error instanceof Error ? error.message : String(error),
      }

      await Promise.all([
        onFailed?.({ message, error }),
        metadata.stream('message-end', toStream(message)),
      ])
    } else {
      message.status = signal.aborted ? 'stopped' : 'finished'

      await Promise.all([
        onFinish?.({ message }),
        metadata.stream('message-end', toStream(message)),
      ])
    }

    return streamingResult
  } catch (error) {
    onError?.({ error })
  }
}
