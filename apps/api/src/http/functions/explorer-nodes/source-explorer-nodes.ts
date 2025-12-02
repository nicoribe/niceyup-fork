import { BadRequestError } from '@/http/errors/bad-request-error'
import type { DBTransaction } from '@workspace/db'
import { db } from '@workspace/db'
import { and, eq, isNull, sql } from '@workspace/db/orm'
import { sourceExplorerNodes } from '@workspace/db/schema'
import { generateKeyBetween } from 'jittered-fractional-indexing'

type GetSourceExplorerNodeFolderParams = {
  id: string
} & (
  | { ownerOrganizationId: string; ownerUserId?: never }
  | { ownerOrganizationId?: never; ownerUserId: string }
)

export async function getSourceExplorerNodeFolder(
  params: GetSourceExplorerNodeFolderParams,
) {
  if (!params.ownerOrganizationId && !params.ownerUserId) {
    throw new BadRequestError({
      code: 'ORGANIZATION_ID_OR_USER_ID_REQUIRED',
      message: 'Organization id or user id is required',
    })
  }

  const ownerTypeCondition = params.ownerOrganizationId
    ? eq(sourceExplorerNodes.ownerOrganizationId, params.ownerOrganizationId)
    : eq(sourceExplorerNodes.ownerUserId, params.ownerUserId!)

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
} & (
  | { ownerOrganizationId: string; ownerUserId?: never }
  | { ownerOrganizationId?: never; ownerUserId: string }
)

export async function createSourceExplorerNodeItem(
  params: CreateSourceExplorerNodeItemParams,
  tx?: DBTransaction,
) {
  if (!params.ownerOrganizationId && !params.ownerUserId) {
    throw new BadRequestError({
      code: 'ORGANIZATION_ID_OR_USER_ID_REQUIRED',
      message: 'Organization id or user id is required',
    })
  }

  const ownerTypeCondition = params.ownerOrganizationId
    ? eq(sourceExplorerNodes.ownerOrganizationId, params.ownerOrganizationId)
    : eq(sourceExplorerNodes.ownerUserId, params.ownerUserId!)

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
