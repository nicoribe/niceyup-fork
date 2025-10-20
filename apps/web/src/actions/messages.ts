'use server'

import { env } from '@/lib/env'
import type { MessageNode, OrganizationTeamParams } from '@/lib/types'
import { createStreamableValue } from '@workspace/ai/rsc'
import { consumeStream } from '@workspace/utils'
import { cookies } from 'next/headers'

type ContextMessageParams = OrganizationTeamParams & { agentId: string }

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
      const searchParams = new URLSearchParams({
        organizationSlug: context.organizationSlug,
        teamId: context.teamId,
        agentId: context.agentId,
      })

      const url = new URL(
        `${env.NEXT_PUBLIC_API_URL}/api/conversations/${conversationId}/messages/${messageId}/stream-answer?${searchParams}`,
      )

      const cookie = (await cookies()).toString()

      const response = await fetch(url, {
        headers: { cookie },
      })

      if (!response.body) {
        return
      }

      const reader = response.body.getReader()

      if (!reader) {
        return
      }

      await consumeStream<MessageNode>({
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
