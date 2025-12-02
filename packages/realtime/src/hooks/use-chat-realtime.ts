'use client'

import * as React from 'react'
import type { AIMessageNode } from '../lib/types'

type ContextParams = {
  organizationSlug: 'my-account' | '$id'
  teamId: '~' | '$id'
  agentId: string
  chatId: 'new' | '$id'
}

type UseChatRealtimeParams = {
  params: ContextParams
}

export function useChatRealtime({ params }: UseChatRealtimeParams) {
  const [error, setError] = React.useState<string>()
  const [messages, setMessages] = React.useState<AIMessageNode[]>([])

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
        `/api/ws/conversations/${params.chatId}/messages/realtime?${searchParams}`,
      )

      websocket = new WebSocket(url)

      websocket.onopen = () => {
        setError(undefined)
      }

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as AIMessageNode[]

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

  return { messages, error }
}
