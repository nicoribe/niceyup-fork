'use client'

import { env } from '@/lib/env'
import type { ChatParams, Message, OrganizationTeamParams } from '@/lib/types'
import { consumeStream } from '@workspace/utils'
import { useParams } from 'next/navigation'
import * as React from 'react'

type Params = OrganizationTeamParams & ChatParams

export function useChatAssistantMessageRealtime({
  messageId,
}: { messageId: string }) {
  const { organizationSlug, teamId, chatId } = useParams<Params>()

  const [error, setError] = React.useState<string>()
  const [message, setMessage] = React.useState<Message>()

  async function startStreamingMessage({
    signal,
    onChunk,
  }: {
    signal?: AbortSignal
    onChunk: (data: Message) => void
  }) {
    try {
      const params = new URLSearchParams({ organizationSlug, teamId })

      const url = new URL(
        `/api/conversations/${chatId}/messages/${messageId}/stream-answer?${params}`,
        env.NEXT_PUBLIC_WEB_URL,
      )

      const response = await fetch(url, { signal })

      if (!response.body) {
        return
      }

      const reader = response.body.getReader()

      if (!reader) {
        return
      }

      await consumeStream({ stream: reader, onChunk })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, don't set error
        return
      }

      setError(error instanceof Error ? error.message : String(error))
    }
  }

  React.useEffect(() => {
    if (!organizationSlug || !teamId || !chatId || !messageId) {
      return
    }

    const abortController = new AbortController()

    startStreamingMessage({
      signal: abortController.signal,
      onChunk: (data) => {
        if (
          data.status === 'stopped' ||
          data.status === 'finished' ||
          data.status === 'failed'
        ) {
          abortController.abort()
        }

        setMessage(data)
      },
    })

    return () => {
      abortController.abort()
    }
  }, [organizationSlug, teamId, chatId, messageId])

  return { message, setMessage, error }
}
