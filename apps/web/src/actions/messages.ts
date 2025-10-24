'use server'

import type { OrganizationTeamParams } from '@/lib/types'
import { streamAnswerMessageFromAPI } from '@workspace/realtime/stream/rsc'
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
  const cookie = (await cookies()).toString()

  const stream = streamAnswerMessageFromAPI(
    {
      conversationId,
      messageId,
      params: {
        organizationSlug: context.organizationSlug,
        teamId: context.teamId,
        agentId: context.agentId,
      },
    },
    {
      headers: {
        Cookie: cookie,
      },
    },
  )

  return stream
}
