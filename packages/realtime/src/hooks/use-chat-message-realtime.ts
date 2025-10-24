'use client'

import { type StreamableValue, readStreamableValue } from '@workspace/ai/rsc'
import * as React from 'react'
import type { AIMessageNode } from '../lib/types'

type ContextParams = {
  organizationSlug: 'my-account' | '$id'
  teamId: '~' | '$id'
  agentId: string
  chatId: 'new' | '$id'
}

type StreamMessageActionParams = (
  context: ContextParams,
  params: { conversationId: string; messageId: string },
) => Promise<StreamableValue<any, any>>

type UseChatMessageRealtimeParams = {
  params: ContextParams
  messageId: string
  streamMessageAction: StreamMessageActionParams
  disable?: boolean
}

export function useChatMessageRealtime({
  params,
  messageId,
  streamMessageAction,
  disable,
}: UseChatMessageRealtimeParams) {
  const [error, setError] = React.useState<string>()
  const [message, setMessage] = React.useState<AIMessageNode>()

  async function startStreaming() {
    try {
      const streamableValue = await streamMessageAction(params, {
        conversationId: params.chatId,
        messageId,
      })

      for await (const messageDelta of readStreamableValue<AIMessageNode>(
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
      disable ||
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

  return { message, error }
}
