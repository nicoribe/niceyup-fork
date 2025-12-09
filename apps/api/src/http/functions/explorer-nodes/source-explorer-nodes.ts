import type { DBTransaction } from '@workspace/db'
import { db } from '@workspace/db'
import { and, eq, isNull, sql } from '@workspace/db/orm'
import { sourceExplorerNodes } from '@workspace/db/schema'
import { generateKeyBetween } from 'jittered-fractional-indexing'

type GetSourceExplorerNodeFolderParams = {
  id: string
  ownerUserId?: string | null
  ownerOrganizationId?: string | null
}

export async function getSourceExplorerNodeFolder(
  params: GetSourceExplorerNodeFolderParams,
) {
  if (!params.ownerOrganizationId && !params.ownerUserId) {
    return null
  }

  const ownerTypeCondition = params.ownerOrganizationId
    ? eq(sourceExplorerNodes.ownerOrganizationId, params.ownerOrganizationId)
    : eq(sourceExplorerNodes.ownerUserId, params.ownerUserId as string)

  const [explorerNode] = await db
    .select({
      id: sourceExplorerNodes.id,
    })
    .from(sourceExplorerNodes)
    .where(
      and(
        eq(sourceExplorerNodes.id, params.id),
        ownerTypeCondition,
        isNull(sourceExplorerNodes.sourceId),
        isNull(sourceExplorerNodes.deletedAt),
      ),
    )
    .limit(1)

  return explorerNode || null
}

type CreateSourceExplorerNodeItemParams = {
  parentId?: string | null
  sourceId: string
  ownerUserId?: string | null
  ownerOrganizationId?: string | null
}

export async function createSourceExplorerNodeItem(
  params: CreateSourceExplorerNodeItemParams,
  tx?: DBTransaction,
) {
  if (!params.ownerOrganizationId && !params.ownerUserId) {
    return null
  }

  const ownerTypeCondition = params.ownerOrganizationId
    ? eq(sourceExplorerNodes.ownerOrganizationId, params.ownerOrganizationId)
    : eq(sourceExplorerNodes.ownerUserId, params.ownerUserId as string)

  const [firstSibling] = await (tx ?? db)
    .select({
      fractionalIndex: sourceExplorerNodes.fractionalIndex,
    })
    .from(sourceExplorerNodes)
    .where(
      and(
        !params.parentId || params.parentId === 'root'
          ? isNull(sourceExplorerNodes.parentId)
          : eq(sourceExplorerNodes.parentId, params.parentId),
        ownerTypeCondition,
        isNull(sourceExplorerNodes.deletedAt),
      ),
    )
    .orderBy(sql`${sourceExplorerNodes.fractionalIndex} COLLATE "C" ASC`)
    .limit(1)

  const fractionalIndex = generateKeyBetween(
    null,
    firstSibling?.fractionalIndex || null,
  )

  const [explorerNode] = await (tx ?? db)
    .insert(sourceExplorerNodes)
    .values({
      sourceId: params.sourceId,
      parentId: params.parentId === 'root' ? null : params.parentId,
      fractionalIndex,
      ownerOrganizationId: params.ownerOrganizationId,
      ownerUserId: params.ownerUserId,
    })
    .returning({
      id: sourceExplorerNodes.id,
    })

  return explorerNode || null
}
