import { sdk } from '@/lib/sdk'
import type { ChatParams, OrganizationTeamParams } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { ChatNotFound } from './_components/chat-not-found'
import { ChatView } from './_components/chat-view'
import { NewChat } from './_components/new-chat'
import { Tabbar } from './_components/tabbar'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { agentId: string } & ChatParams>
}>) {
  const { organizationSlug, teamId, agentId, chatId } = await params

  const { data } = await sdk.getConversation(
    {
      conversationId: chatId,
      params: { organizationSlug, teamId },
    },
    { next: { tags: [`chat-${chatId}`] } },
  )

  return (
    <div className="flex h-full flex-col">
      <Tabbar
        organizationSlug={organizationSlug}
        teamId={teamId}
        agentId={agentId}
        chatId={chatId}
        chat={data?.conversation ?? null}
      />

      <Separator />

      {data?.conversation ? (
        <ChatView chat={data.conversation} />
      ) : chatId === 'new' ? (
        <NewChat />
      ) : (
        <ChatNotFound />
      )}
    </div>
  )
}
