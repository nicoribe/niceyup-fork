import { getConversation } from '@/actions/conversations'
import type { ChatParams } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import { unstable_cache } from 'next/cache'
import { Tabbar } from './_components/tabbar'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ agentId: string } & ChatParams>
}>) {
  const { agentId, chatId } = await params

  const getCachedConversation = unstable_cache(getConversation, [chatId], {
    tags: [`chat-${chatId}`],
  })

  const chat = await getCachedConversation(agentId, chatId)

  return (
    <div className="flex h-full flex-col">
      <Tabbar chatId={chatId} chat={chat} />

      <Separator />

      <div
        className={cn(
          'flex h-full flex-col items-center overflow-auto p-2',
          chat ? 'justify-start' : 'justify-center',
        )}
      >
        {chat ? (
          <h1 className="text-sm">Chat: {chat.title}</h1>
        ) : chatId === 'new' ? (
          <h1 className="text-sm">New Chat</h1>
        ) : (
          <h1 className="text-sm">Chat Not Found</h1>
        )}
      </div>
    </div>
  )
}
