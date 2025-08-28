import { getParentsInConversationExplorerTree } from '@/actions/conversation-explorer-tree'
import type { Chat, ChatParams, OrganizationTeamParams } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { Appearance } from '../../_components/appearance'
import { ExplorerTreePath } from './explorer-tree-path'
import { OpenChats } from './open-chats'

export async function Tabbar({
  organizationSlug,
  teamId,
  agentId,
  chatId,
  chat,
}: {
  organizationSlug: OrganizationTeamParams['organizationSlug']
  teamId: OrganizationTeamParams['teamId']
  agentId: string
  chatId: ChatParams['chatId']
  chat: Chat | null
}) {
  const pathInExplorer = chat
    ? await getParentsInConversationExplorerTree(
        { organizationSlug, teamId, agentId },
        {
          explorerType: 'private',
          conversationId: chat.id,
        },
      )
    : []

  return (
    <>
      <OpenChats chat={chat} pathInExplorer={pathInExplorer} />

      <Separator />

      <div className="flex flex-row items-center bg-background">
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
