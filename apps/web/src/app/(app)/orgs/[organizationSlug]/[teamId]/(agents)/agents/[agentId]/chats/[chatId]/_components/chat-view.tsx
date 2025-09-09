import { authenticatedUser } from '@/lib/auth/server'
import { sdk } from '@/lib/sdk'
import type { Chat, Message } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { ChatConversation, ChatPromptInput, ChatProvider } from './chat'

export async function ChatView({
  organizationSlug,
  teamId,
  chat,
}: { organizationSlug: string; teamId: string; chat: Chat }) {
  const {
    user: { id: userId },
  } = await authenticatedUser()

  const { data, error } = await sdk.listMessages({
    conversationId: chat.id,
    params: { organizationSlug, teamId, parents: true },
  })

  if (error) {
    return (
      <div className="flex size-full flex-col items-center justify-center bg-background">
        <div className="p-2">
          <h1 className="text-sm">{error.message}</h1>
        </div>
      </div>
    )
  }

  return (
    <ChatProvider
      authorId={userId}
      initialMessages={data.messages as Message[]}
    >
      <ChatConversation />

      <Separator />

      <div className="mx-auto w-full max-w-3xl p-4">
        <ChatPromptInput />
      </div>
    </ChatProvider>
  )
}
