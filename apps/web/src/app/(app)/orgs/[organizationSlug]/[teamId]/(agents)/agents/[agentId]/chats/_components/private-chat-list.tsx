'use client'

import { revalidateTag } from '@/actions/revalidate'
import type { Chat, OrganizationTeamParams } from '@/lib/types'
import { ChatList, ChatListProvider } from './chat-list'

type Params = OrganizationTeamParams & { agentId: string }

export function PrivateChatList({
  params,
  initialItems,
}: { params: Params; initialItems?: Chat[] }) {
  return (
    <ChatListProvider
      params={params}
      visibility="private"
      initialItems={initialItems}
      onRenameItem={async (item) => {
        await revalidateTag(`chat-${item.id}`)
      }}
      onDeleteItem={async () => {
        await revalidateTag(`agent-${params.agentId}-chats`)
      }}
    >
      <ChatList />
    </ChatListProvider>
  )
}
