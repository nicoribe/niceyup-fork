import { authenticatedUser } from '@/lib/auth/server'
import { sdk } from '@/lib/sdk'
import type {
  Chat,
  ChatParams,
  MessageNode,
  OrganizationTeamParams,
} from '@/lib/types'
import { ChatView } from './chat-view'

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

export async function ChatViewWrapper({
  params,
  chat,
}: {
  params: Params
  chat: Chat
}) {
  const {
    user: { id: userId },
  } = await authenticatedUser()

  const { data, error } = await sdk.listMessages({
    conversationId: chat.id,
    params: {
      organizationSlug: params.organizationSlug,
      teamId: params.teamId,
      agentId: params.agentId,
      parentNodes: true,
    },
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
    <ChatView
      params={params}
      authorId={userId}
      initialMessages={data.messages as MessageNode[]}
    />
  )
}
