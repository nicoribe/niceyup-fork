import { getParentsInConversationExplorerTree } from '@/actions/conversation-explorer-tree'
import type { Chat } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { Appearance } from '../../_components/appearance'
import { ExplorerTreePath } from './explorer-tree-path'
import { OpenChats } from './open-chats'

export async function Tabbar({
  agentId,
  chatId,
  chat,
}: {
  agentId: string
  chatId: string
  chat: Chat | null
}) {
  const pathInExplorer = chat
    ? await getParentsInConversationExplorerTree(agentId, {
        explorerType: 'private',
        conversationId: chat.id,
      })
    : []

  return (
    <>
      <OpenChats chat={chat} pathInExplorer={pathInExplorer} />

      <Separator />

      <div className="flex flex-row items-center bg-background px-1">
        <div className="no-scrollbar flex flex-1 flex-row items-center gap-1 overflow-x-scroll py-1">
          {(chatId === 'new' || chat) && (
            <ExplorerTreePath pathInExplorer={pathInExplorer} />
          )}
        </div>

        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-full"
        />

        <Appearance />
      </div>
    </>
  )
}
