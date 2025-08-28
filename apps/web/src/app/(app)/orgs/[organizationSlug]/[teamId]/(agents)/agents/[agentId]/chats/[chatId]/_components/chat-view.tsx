import { listMessages } from '@/actions/messages'
import type { Chat } from '@/lib/types'
import { ChatMessages } from './chat-messages'

export async function ChatView({ chat }: { chat: Chat }) {
  const messages = await listMessages({
    conversationId: chat.id,
    parents: true,
  })

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background">
      <ChatMessages initialMessages={messages} />
    </div>
  )
}
