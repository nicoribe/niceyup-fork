import { sdk } from '@/lib/sdk'
import type { Chat, ChatParams, OrganizationTeamParams } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { ChatNotFound } from './_components/chat-not-found'
import { ChatViewWrapper } from './_components/chat-view-wrapper'
import { NewChatWrapper } from './_components/new-chat-wrapper'
import { Tabbar } from './_components/tabbar'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { agentId: string } & ChatParams>
}>) {
  const { organizationSlug, teamId, agentId, chatId } = await params

  let chat: Chat | null = null

  if (chatId !== 'new') {
    const { data } = await sdk.getConversation(
      {
        conversationId: chatId,
        params: { organizationSlug, teamId, agentId },
      },
      { next: { tags: [`chat-${chatId}`] } },
    )

    chat = data?.conversation || null
  }

  return (
    <div className="flex h-full flex-col bg-background">
      <Tabbar params={{ chatId }} chat={chat} />

      <Separator />

      {chat ? (
        <ChatViewWrapper
          params={{ organizationSlug, teamId, agentId, chatId }}
          chat={chat}
        />
      ) : chatId === 'new' ? (
        <NewChatWrapper
          params={{ organizationSlug, teamId, agentId, chatId }}
        />
      ) : (
        <ChatNotFound />
      )}
    </div>
  )
}
