'use client'

import { streamAnswerMessage } from '@/actions/messages'
import type { ChatParams, Message, OrganizationTeamParams } from '@/lib/types'
import { readStreamableValue } from '@workspace/ai/rsc'
import { useParams } from 'next/navigation'
import * as React from 'react'

type Params = OrganizationTeamParams & ChatParams

type UseChatAssistantMessageRealtimeParams = {
  messageId: string
}

export function useChatAssistantMessageRealtime({
  messageId,
}: UseChatAssistantMessageRealtimeParams) {
  const { organizationSlug, teamId, chatId } = useParams<Params>()

  const [error, setError] = React.useState<string>()
  const [message, setMessage] = React.useState<Message>()

  async function startStreamingMessage() {
    try {
      const streamableValue = await streamAnswerMessage(
        { organizationSlug, teamId },
        { conversationId: chatId, messageId },
      )

      for await (const messageDelta of readStreamableValue(streamableValue)) {
        setMessage(messageDelta)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    }
  }

  React.useEffect(() => {
    if (!organizationSlug || !teamId || !chatId || !messageId) {
      return
    }

    startStreamingMessage()
  }, [organizationSlug, teamId, chatId, messageId])

  return { message, setMessage, error }
}
