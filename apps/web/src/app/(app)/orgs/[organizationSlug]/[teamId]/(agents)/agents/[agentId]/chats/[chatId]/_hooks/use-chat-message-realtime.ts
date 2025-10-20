'use client'

import { streamAnswerMessage } from '@/actions/messages'
import type {
  ChatParams,
  MessageNode,
  OrganizationTeamParams,
} from '@/lib/types'
import { readStreamableValue } from '@workspace/ai/rsc'
import * as React from 'react'

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

type UseChatAssistantMessageRealtimeParams = {
  params: Params
  messageId: string
}
export function useChatAssistantMessageRealtime({
  params,
  messageId,
}: UseChatAssistantMessageRealtimeParams) {
  const [error, setError] = React.useState<string>()
  const [message, setMessage] = React.useState<MessageNode>()

  async function startStreaming() {
    try {
      const streamableValue = await streamAnswerMessage(params, {
        conversationId: params.chatId,
        messageId,
      })

      for await (const messageDelta of readStreamableValue<MessageNode>(
        streamableValue,
      )) {
        setMessage(messageDelta)
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    }
  }

  React.useEffect(() => {
    if (
      !params.organizationSlug ||
      !params.teamId ||
      !params.agentId ||
      !params.chatId ||
      params.chatId === 'new' ||
      !messageId
    ) {
      return
    }

    startStreaming()
  }, [
    params.organizationSlug,
    params.teamId,
    params.agentId,
    params.chatId,
    messageId,
  ])

  return { message, setMessage, error }
}
