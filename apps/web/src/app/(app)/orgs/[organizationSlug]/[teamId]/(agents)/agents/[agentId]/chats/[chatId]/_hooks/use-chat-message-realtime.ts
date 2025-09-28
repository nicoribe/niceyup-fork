'use client'

import { env } from '@/lib/env'
import type { ChatParams, Message, OrganizationTeamParams } from '@/lib/types'
import { useParams } from 'next/navigation'
import * as React from 'react'

async function consumeStream<T>({
  stream,
  onChunk,
}: {
  stream: ReadableStreamDefaultReader<Uint8Array>
  onChunk: (data: T) => void
}) {
  const decoder = new TextDecoder()
  let buf = ''

  while (true) {
    const { value, done } = await stream.read()

    if (done) {
      break
    }

    buf += decoder.decode(value, { stream: true })

    const lines = buf.split('\n')
    buf = lines.pop() ?? ''

    for (const line of lines) {
      if (!line) {
        continue
      }

      onChunk(JSON.parse(line) as T)
    }
  }

  if (buf.trim()) {
    onChunk(JSON.parse(buf) as T)
  }
}

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

    let abortController: AbortController | null = null

    const getMessageStream = async () => {
      try {
        abortController = new AbortController()

        const response = await fetch(
          `${env.NEXT_PUBLIC_WEB_URL}/api/conversations/${chatId}/messages/${messageId}/stream-answer?organizationSlug=${organizationSlug}&teamId=${teamId}`,
          { signal: abortController.signal },
        )

        if (!response.body) {
          return
        }

        const reader = response.body.getReader()

        if (!reader) {
          return
        }

        await consumeStream<Message>({ stream: reader, onChunk: setMessage })
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, don't set error
          return
        }

        setError(error instanceof Error ? error.message : String(error))
      }
    }

    getMessageStream()

    // Cleanup function
    return () => {
      if (abortController) {
        abortController.abort()
      }
    }
  }, [organizationSlug, teamId, chatId, messageId])

  return { message, setMessage, error }
}
