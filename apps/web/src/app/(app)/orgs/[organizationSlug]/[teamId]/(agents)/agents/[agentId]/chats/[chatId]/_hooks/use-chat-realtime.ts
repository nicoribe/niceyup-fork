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
    if (
      !organizationSlug ||
      organizationSlug === 'my-account' ||
      !teamId ||
      teamId === '~' ||
      !chatId ||
      chatId === 'new'
    ) {
      return
    }

    let websocket: WebSocket | null = null

    try {
      const params = new URLSearchParams({ organizationSlug, teamId })

      const url = new URL(
        `/api/conversations/${chatId}/messages/realtime?${params}`,
        env.NEXT_PUBLIC_WEBSOCKET_URL,
      )

      websocket = new WebSocket(url)

      websocket.onopen = () => {
        setError(undefined)
      }

      websocket.onmessage = (event) => {
        try {
          const data: Message[] = JSON.parse(event.data)

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
  }, [organizationSlug, teamId, chatId])

  return { messages, setMessages, error }
}
