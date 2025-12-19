import { sdk } from '@/lib/sdk'
import type {
  AgentParams,
  ChatParams,
  OrganizationTeamParams,
} from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { cacheTag } from 'next/cache'
import { ChatNotFound } from './_components/chat-not-found'
import { ChatViewWrapper } from './_components/chat-view-wrapper'
import { NewChatWrapper } from './_components/new-chat-wrapper'
import { Tabbar } from './_components/tabbar'

type Params = OrganizationTeamParams & AgentParams & ChatParams

async function getConversation(params: Params) {
  'use cache: private'
  cacheTag('update-chat')

  if (params.chatId !== 'new') {
    const { data } = await sdk.getConversation({
      conversationId: params.chatId,
      params: {
        organizationSlug: params.organizationSlug,
        teamId: params.teamId,
        agentId: params.agentId,
      },
    })

    return data?.conversation || null
  }

  return null
}

export default async function Page({
  params,
}: Readonly<{
  params: Promise<Params>
}>) {
  const { organizationSlug, teamId, agentId, chatId } = await params

  const chat = await getConversation({
    organizationSlug,
    teamId,
    agentId,
    chatId,
  })

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
