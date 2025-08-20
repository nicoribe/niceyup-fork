import type { ConversationExplorerType } from '@/actions/conversation-explorer-tree'

export type PathInExplorer = {
  id: string
  name: string
  explorer_type: ConversationExplorerType
  parent_id: string | null
  conversation_id: string | null
  deleted_at: string | null
  level: number
}
