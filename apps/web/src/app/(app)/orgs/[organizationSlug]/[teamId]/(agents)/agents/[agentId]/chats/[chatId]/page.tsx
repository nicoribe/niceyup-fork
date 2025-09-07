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

  const suggestions = [
    'What are the latest trends in AI?',
    'How does machine learning work?',
    'Explain quantum computing',
    'Best practices for React development',
    'Tell me about TypeScript benefits',
    'How to optimize database queries?',
    'What is the difference between SQL and NoSQL?',
    'Explain cloud computing basics',
  ]

  return (
    <div className="flex h-full flex-col bg-background">
      <Tabbar
        organizationSlug={organizationSlug}
        teamId={teamId}
        agentId={agentId}
        chatId={chatId}
        chat={data?.conversation ?? null}
      />

      <Separator />

      {data?.conversation ? (
        <ChatView
          organizationSlug={organizationSlug}
          teamId={teamId}
          chat={data.conversation}
        />
      ) : chatId === 'new' ? (
        <NewChat suggestions={suggestions} />
      ) : (
        <ChatNotFound />
      )}
    </div>
  )
}
