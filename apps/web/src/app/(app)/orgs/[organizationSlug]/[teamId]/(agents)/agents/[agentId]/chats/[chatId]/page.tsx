import { sdk } from '@/lib/sdk'
import type { ChatParams } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import { Tabbar } from './_components/tabbar'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ agentId: string } & ChatParams>
}>) {
  const { agentId, chatId } = await params

  const { data } = await sdk.getConversation(
    { conversationId: chatId },
    { next: { tags: [`chat-${chatId}`] } },
  )

  return (
    <div className="flex h-full flex-col">
      <Tabbar
        agentId={agentId}
        chatId={chatId}
        chat={data?.conversation ?? null}
      />

      <Separator />

      <div
        className={cn(
          'flex h-full flex-col items-center overflow-auto p-2',
          data?.conversation ? 'justify-start' : 'justify-center',
        )}
      >
        {data?.conversation ? (
          <h1 className="text-sm">Chat: {data?.conversation.title}</h1>
        ) : chatId === 'new' ? (
          <h1 className="text-sm">New Chat</h1>
        ) : (
          <h1 className="text-sm">Chat Not Found</h1>
        )}
      </div>
    </div>
  )
}
