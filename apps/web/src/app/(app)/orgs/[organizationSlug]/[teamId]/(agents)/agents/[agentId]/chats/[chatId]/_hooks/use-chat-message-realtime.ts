'use client'

import { env } from '@/lib/env'
import type { ChatParams, Message, OrganizationTeamParams } from '@/lib/types'
import { useParams } from 'next/navigation'
import * as React from 'react'

type Params = OrganizationTeamParams & ChatParams

export function useChatAssistantMessageRealtime({
  messageId,
}: { messageId: string }) {
  const { organizationSlug, teamId, chatId } = useParams<Params>()

  const [error, setError] = React.useState<string>()
  const [message, setMessage] = React.useState<Message>()

  React.useEffect(() => {
    if (!organizationSlug || !teamId || !chatId || !messageId) {
      return
    }

    let eventSource: EventSource | null = null

    try {
      const queryParams = new URLSearchParams({ organizationSlug, teamId })

      const url = `${env.NEXT_PUBLIC_WEB_URL}/api/conversations/${chatId}/messages/${messageId}/stream-answer?${queryParams.toString()}`

      eventSource = new EventSource(url)

      eventSource.onopen = () => {
        setError(undefined)
      }

      eventSource.onmessage = (event) => {
        try {
          const data: Message = JSON.parse(event.data)

          setMessage(data)
        } catch {
          setError('Connection error occurred')
        }
      }

      eventSource.onerror = () => {
        setError('Connection error occurred, please try again')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error))
    }

    return () => {
      if (eventSource) {
        eventSource.close()
      }
    }
  }, [organizationSlug, teamId, chatId, messageId])

  return { message, setMessage, error }
}
