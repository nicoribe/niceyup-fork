import { readUIMessageStream, type streamText } from 'ai'
import type { AIMessage } from './types'

export function readAIMessageStream<AI_MESSAGE extends AIMessage>({
  message,
  stream,
}: { message?: AI_MESSAGE; stream: ReturnType<typeof streamText> }) {
  const messageStream = readUIMessageStream({
    message: message,
    stream: stream.toUIMessageStream({
      sendSources: true,
    }),
  })

  //  const messageStream = readMessageStream.pipeThrough(
  //    new TransformStream({
  //      transform: (chunk, controller) => {
  //        const message = {
  //          id: chunk.id,
  //          role: chunk.role,
  //          parts: chunk.parts.map(({ providerMetadata, ...rest }: any) => rest),
  //        }
  //        controller.enqueue(message)
  //      },
  //    }),
  //  )

  return messageStream
}
