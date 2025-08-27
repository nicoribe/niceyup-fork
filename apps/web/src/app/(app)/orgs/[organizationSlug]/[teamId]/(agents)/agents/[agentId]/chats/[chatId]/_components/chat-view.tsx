import { listMessages } from '@/actions/messages'
import type { Chat } from '@/lib/types'

export async function ChatView({ chat }: { chat: Chat }) {
  const messages = await listMessages({
    conversationId: chat.id,
    parents: true,
  })

  return (
    <div className="flex h-full flex-col items-center justify-start overflow-auto p-2">
      <h1 className="text-sm">Chat: {chat.title}</h1>
      <pre className="text-xs">{JSON.stringify(messages, null, 2)}</pre>
    </div>
  )
}
