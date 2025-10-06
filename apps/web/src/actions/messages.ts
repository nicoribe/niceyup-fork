'use server'

import { env } from '@/lib/env'
import type { Message, OrganizationTeamParams } from '@/lib/types'
import { createStreamableValue } from '@workspace/ai/rsc'
import { consumeStream } from '@workspace/utils'
import { cookies } from 'next/headers'

type ContextMessageParams = OrganizationTeamParams

type StreamAnswerMessageParams = {
  conversationId: string
  messageId: string
}

export async function streamAnswerMessage(
  context: ContextMessageParams,
  { conversationId, messageId }: StreamAnswerMessageParams,
) {
  'use server'

  const streamable = createStreamableValue()

  // Start streaming the message
  ;(async () => {
    let isDone = false

    try {
      const params = new URLSearchParams({
        organizationSlug: context.organizationSlug,
        teamId: context.teamId,
      })

      const url = new URL(
        `${env.NEXT_PUBLIC_API_URL}/api/conversations/${conversationId}/messages/${messageId}/stream-answer?${params}`,
      )

      const response = await fetch(url, {
        headers: {
          cookie: (await cookies()).toString(),
        },
      })

      if (!response.body) {
        return
      }

      const reader = response.body.getReader()

      if (!reader) {
        return
      }

      await consumeStream<Message>({
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
