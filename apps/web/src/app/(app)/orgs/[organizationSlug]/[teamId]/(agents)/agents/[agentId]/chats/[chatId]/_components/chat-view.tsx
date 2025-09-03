import { authenticatedUser } from '@/lib/auth/server'
import { sdk } from '@/lib/sdk'
import type { Chat, Message } from '@/lib/types'
import { ChatMessages } from './chat-messages'

export async function ChatView({
  organizationSlug,
  teamId,
  chat,
}: { organizationSlug: string; teamId: string; chat: Chat }) {
  const { user } = await authenticatedUser()

  const { data, error } = await sdk.listMessages({
    conversationId: chat.id,
    params: { organizationSlug, teamId, parents: true },
  })

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <div className="p-2">
          <h1 className="text-sm">{error.message}</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background">
      <ChatMessages
        userId={user.id}
        initialMessages={data.messages as Message[]}
      />
    </div>
  )
}
