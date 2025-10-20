'use client'

import { env } from '@/lib/env'
import type {
  ChatParams,
  MessageNode,
  OrganizationTeamParams,
} from '@/lib/types'
import * as React from 'react'

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

type UseChatRealtimeParams = {
  params: Params
}

export function useChatRealtime({ params }: UseChatRealtimeParams) {
  const [error, setError] = React.useState<string>()
  const [messages, setMessages] = React.useState<MessageNode[]>([])

  React.useEffect(() => {
    if (
      !params.organizationSlug ||
      params.organizationSlug === 'my-account' ||
      !params.teamId ||
      params.teamId === '~' ||
      !params.agentId ||
      !params.chatId ||
      params.chatId === 'new'
    ) {
      return
    }

    let websocket: WebSocket | null = null

    try {
      const searchParams = new URLSearchParams({
        organizationSlug: params.organizationSlug,
        teamId: params.teamId,
      })

      const url = new URL(
        `/api/conversations/${params.chatId}/messages/realtime?${searchParams}`,
        env.NEXT_PUBLIC_WEBSOCKET_URL,
      )

      websocket = new WebSocket(url)

      websocket.onopen = () => {
        setError(undefined)
      }

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as MessageNode[]

          setMessages(data)
        } catch {
          setError('Connection error occurred')
        }
      }
    } catch (error) {
      websocket?.close()
      setError(error instanceof Error ? error.message : String(error))
    }

    return () => {
      websocket?.close()
    }
  }, [params.organizationSlug, params.teamId, params.agentId, params.chatId])

  return { messages, setMessages, error }
}
