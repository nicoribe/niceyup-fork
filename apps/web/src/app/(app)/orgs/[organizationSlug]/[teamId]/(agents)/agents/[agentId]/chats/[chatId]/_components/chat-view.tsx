'use client'

import type {
  ChatParams,
  MessageNode,
  OrganizationTeamParams,
} from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { ChatConversation, ChatPromptInput, ChatProvider } from './chat'

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

export function ChatView({
  params,
  authorId,
  initialMessages,
}: {
  params: Params
  authorId: string
  initialMessages: MessageNode[]
}) {
  return (
    <ChatProvider
      params={params}
      authorId={authorId}
      initialMessages={initialMessages}
    >
      <ChatConversation />

      <Separator />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-2 px-4 py-2">
        <ChatPromptInput />

        <div className="text-center text-[11px] text-muted-foreground">
          AI assistants might make mistakes. Check important information.
        </div>
      </div>
    </ChatProvider>
  )
}
