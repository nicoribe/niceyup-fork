'use client'

import { env } from '@/lib/env'
import type { ChatParams, Message, OrganizationTeamParams } from '@/lib/types'
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

  React.useEffect(() => {
    if (!organizationSlug || !teamId || !chatId || !messageId) {
      return
    }

    let eventSource: EventSource | null = null

    try {
      const params = new URLSearchParams({ organizationSlug, teamId })

      const url = new URL(
        `/api/conversations/${chatId}/messages/${messageId}/stream-answer?${params}`,
        env.NEXT_PUBLIC_WEB_URL,
      )

      eventSource = new EventSource(url)

      eventSource.onopen = () => {
        setError(undefined)
      }

      eventSource.onmessage = (event) => {
        try {
          const data: Message = JSON.parse(event.data)

          if (
            data.status === 'stopped' ||
            data.status === 'finished' ||
            data.status === 'failed'
          ) {
            eventSource?.close()
          }

          setMessage(data)
        } catch {
          eventSource?.close()
          setError('Connection error occurred')
        }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        setError('Connection error occurred, please try again')
      }
    } catch (error) {
      eventSource?.close()
      setError(error instanceof Error ? error.message : String(error))
    }

    return () => {
      eventSource?.close()
    }
  }, [organizationSlug, teamId, chatId, messageId])

  return { message, setMessage, error }
}
