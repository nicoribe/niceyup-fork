import { Readable } from 'node:stream'
import { runs } from '@workspace/engine'
import type { STREAMS } from '@workspace/engine/tasks/answer-message'
import type { AIMessageNode } from '../lib/types'

export function streamAnswerMessageFromRun({
  message,
}: { message: AIMessageNode }) {
  return Readable.from(
    (async function* source() {
      yield `${JSON.stringify(message)}\n`

      if (
        (message.status === 'queued' || message.status === 'processing') &&
        message.metadata?.triggerTask?.id
      ) {
        const realtimeRunStream = runs
          .subscribeToRun(message.metadata.triggerTask.id)
          .withStreams<STREAMS>()

        for await (const part of realtimeRunStream) {
          switch (part.type) {
            case 'message-start':
            case 'message-delta':
            case 'message-end':
              yield `${JSON.stringify({ ...message, ...part.chunk })}\n`
              break
          }
        }
      }

      return
    })(),
  )
}
