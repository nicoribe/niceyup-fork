'use client'

import { env } from '@/lib/env'
import type { ChatParams, Message, OrganizationTeamParams } from '@/lib/types'
import { useParams } from 'next/navigation'
import * as React from 'react'

type Params = OrganizationTeamParams & ChatParams

export function useChatRealtime() {
  const { organizationSlug, teamId, chatId } = useParams<Params>()

  const [error, setError] = React.useState<string>()
  const [messages, setMessages] = React.useState<Message[]>([])

  React.useEffect(() => {
    if (!organizationSlug || !teamId || !chatId) {
      return
    }

    let ws: WebSocket | null = null

    try {
      ws = new WebSocket(
        `${env.NEXT_PUBLIC_WEBSOCKET_URL}/api/conversations/${chatId}/messages?organizationSlug=${organizationSlug}&teamId=${teamId}`,
      )

      ws.onmessage = (event) => {
        const data: Message[] = JSON.parse(event.data)
        setMessages(data)
      }

      ws.onerror = () => {
        setError('Error connecting to WebSocket')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    }

    // Cleanup function
    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [organizationSlug, teamId, chatId])

  return { messages, setMessages, error }
}
