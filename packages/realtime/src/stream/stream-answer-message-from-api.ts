import { createStreamableValue } from '@workspace/ai/rsc'
import { env } from '../lib/env'
import type { AIMessageNode } from '../lib/types'
import { consumeStream } from '../lib/utils'

export function streamAnswerMessageFromAPI(
  {
    conversationId,
    messageId,
    params,
  }: {
    conversationId: string
    messageId: string
    params: { organizationSlug: string; teamId: string; agentId: string }
  },
  { headers }: { headers?: HeadersInit | undefined },
) {
  const streamable = createStreamableValue()

  // Start streaming the message
  ;(async () => {
    let isDone = false

    try {
      const searchParams = new URLSearchParams(params)

      const url = new URL(
        `${env.API_URL}/api/conversations/${conversationId}/messages/${messageId}/stream-answer?${searchParams}`,
      )

      const response = await fetch(url, { headers })

      if (!response.body) {
        return
      }

      const reader = response.body.getReader()

      if (!reader) {
        return
      }

      await consumeStream<AIMessageNode>({
        stream: reader,
        onChunk: (data) => {
          if (!isDone) {
            streamable.update(data)

            if (
              data.status === 'stopped' ||
              data.status === 'finished' ||
              data.status === 'failed'
            ) {
              isDone = true
              streamable.done()
            }
          }
        },
        onError: (error) => {
          console.error('Error streaming message', error)
        },
      })
    } catch (error) {
      console.error('Error streaming message', error)
    } finally {
      if (!isDone) {
        streamable.done()
      }
    }
  })()

  return streamable.value
}
