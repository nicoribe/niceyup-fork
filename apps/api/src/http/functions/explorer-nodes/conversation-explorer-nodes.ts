import { BadRequestError } from '@/http/errors/bad-request-error'
import type { DBTransaction } from '@workspace/db'
import { db } from '@workspace/db'
import { and, eq, isNull, sql } from '@workspace/db/orm'
import { conversationExplorerNodes } from '@workspace/db/schema'
import type { ConversationExplorerNodeVisibility } from '@workspace/db/types'
import { generateKeyBetween } from 'jittered-fractional-indexing'

type GetConversationExplorerNodeFolderParams = {
  id: string
  visibility: ConversationExplorerNodeVisibility
  agentId: string
} & (
  | { ownerTeamId: string; ownerUserId?: never }
  | { ownerTeamId?: never; ownerUserId: string }
)

export async function getConversationExplorerNodeFolder(
  params: GetConversationExplorerNodeFolderParams,
) {
  if (params.visibility === 'team' && !params.ownerTeamId) {
    throw new BadRequestError({
      code: 'TEAM_ID_REQUIRED',
      message:
        'Team is required when the explorer node visibility is set to "team"',
    })
  }

  if (params.visibility !== 'team' && !params.ownerUserId) {
    throw new BadRequestError({
      code: 'USER_ID_REQUIRED',
      message:
        'User is required when the explorer node visibility is set to "private" or "shared"',
    })
  }

  const ownerTypeCondition = params.ownerTeamId
    ? eq(conversationExplorerNodes.ownerTeamId, params.ownerTeamId)
    : eq(conversationExplorerNodes.ownerUserId, params.ownerUserId!)

  const [folderExplorerNode] = await db
    .select({
      id: conversationExplorerNodes.id,
    })
    .from(conversationExplorerNodes)
    .where(
      and(
        eq(conversationExplorerNodes.id, params.id),
        eq(conversationExplorerNodes.visibility, params.visibility),
        eq(conversationExplorerNodes.agentId, params.agentId),
        isNull(conversationExplorerNodes.conversationId),
        ownerTypeCondition,
        isNull(conversationExplorerNodes.deletedAt),
      ),
    )
    .limit(1)

  return folderExplorerNode || null
}

type CreateConversationExplorerNodeItemParams = {
  visibility: ConversationExplorerNodeVisibility
  agentId: string
  parentId?: string | null
  conversationId: string
} & (
  | { ownerTeamId: string; ownerUserId?: never }
  | { ownerTeamId?: never; ownerUserId: string }
)

export async function createConversationExplorerNodeItem(
  params: CreateConversationExplorerNodeItemParams,
  tx?: DBTransaction,
) {
  if (params.visibility === 'team' && !params.ownerTeamId) {
    throw new BadRequestError({
      code: 'TEAM_ID_REQUIRED',
      message:
        'Team is required when the explorer node visibility is set to "team"',
    })
  }

  if (params.visibility !== 'team' && !params.ownerUserId) {
    throw new BadRequestError({
      code: 'USER_ID_REQUIRED',
      message:
        'User is required when the explorer node visibility is set to "private" or "shared"',
    })
  }

  const ownerTypeCondition = params.ownerTeamId
    ? eq(conversationExplorerNodes.ownerTeamId, params.ownerTeamId)
    : eq(conversationExplorerNodes.ownerUserId, params.ownerUserId!)

  const [firstSibling] = await (tx ?? db)
    .select({
      fractionalIndex: conversationExplorerNodes.fractionalIndex,
    })
    .from(conversationExplorerNodes)
    .where(
      and(
        !params.parentId || params.parentId === 'root'
          ? isNull(conversationExplorerNodes.parentId)
          : eq(conversationExplorerNodes.parentId, params.parentId),
        eq(conversationExplorerNodes.visibility, params.visibility),
        eq(conversationExplorerNodes.agentId, params.agentId),
        ownerTypeCondition,
        isNull(conversationExplorerNodes.deletedAt),
      ),
    )
    .orderBy(sql`${conversationExplorerNodes.fractionalIndex} COLLATE "C" ASC`)
    .limit(1)

  const fractionalIndex = generateKeyBetween(
    null,
    firstSibling?.fractionalIndex || null,
  )

  const [explorerNode] = await (tx ?? db)
    .insert(conversationExplorerNodes)
    .values({
      visibility: params.visibility,
      agentId: params.agentId,
      conversationId: params.conversationId,
      parentId: params.parentId === 'root' ? null : params.parentId,
      fractionalIndex,
      ownerTeamId: params.ownerTeamId,
      ownerUserId: params.ownerUserId,
    })
    .returning({
      id: conversationExplorerNodes.id,
    })

  return explorerNode || null
}
