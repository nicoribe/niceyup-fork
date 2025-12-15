'use server'

import { authenticatedUser } from '@/lib/auth/server'
import { getOrganizationContext } from '@/lib/organization-context'
import type { OrganizationTeamParams } from '@/lib/types'
import { db } from '@workspace/db'
import { and, eq, isNull, sql } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import { sourceExplorerNodes, sources } from '@workspace/db/schema'

type ContextSourceExplorerNodeParams = OrganizationTeamParams

async function checkAdminAccess(
  context: { userId: string } & ContextSourceExplorerNodeParams,
) {
  if (context.organizationSlug === 'my-account') {
    return true
  }

  const isAdmin = await queries.context.isOrganizationMemberAdmin(context)

  return isAdmin
}

type GetItemInSourceExplorerNodeParams = {
  itemId: string
}

export async function getItemInSourceExplorerNode(
  context: ContextSourceExplorerNodeParams,
  { itemId }: GetItemInSourceExplorerNodeParams,
) {
  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAdminAccess({ userId, ...context }))) {
    return null
  }

  const ctx = await getOrganizationContext({ userId, ...context })

  if (!ctx) {
    return null
  }

  const ownerTypeCondition = ctx.organizationId
    ? eq(sourceExplorerNodes.ownerOrganizationId, ctx.organizationId)
    : eq(sourceExplorerNodes.ownerUserId, ctx.userId)

  const [itemData] = await db
    .select({
      id: sourceExplorerNodes.id,
      name: sql<string>`
          CASE
            WHEN ${sourceExplorerNodes.sourceId} IS NOT NULL
            THEN COALESCE(${sources.name}, ${sourceExplorerNodes.name})
            ELSE ${sourceExplorerNodes.name}
          END
        `.as('name'),
      sourceId: sourceExplorerNodes.sourceId,
      sourceType: sourceExplorerNodes.sourceType,
      fractionalIndex: sourceExplorerNodes.fractionalIndex,
      children: sql<string[]>`
          (SELECT COALESCE(ARRAY_AGG(id), '{}'::text[])
           FROM ${sourceExplorerNodes} child_node
           WHERE child_node.parent_id = ${sourceExplorerNodes.id}
           AND child_node.deleted_at IS NULL)
        `.as('children'),
    })
    .from(sourceExplorerNodes)
    .leftJoin(sources, eq(sourceExplorerNodes.sourceId, sources.id))
    .where(
      and(
        ownerTypeCondition,
        eq(sourceExplorerNodes.id, itemId),
        isNull(sourceExplorerNodes.deletedAt),
      ),
    )
    .limit(1)

  return itemData || null
}

type GetChildrenWithDataInSourceExplorerNodeParams = {
  itemId: string
}

export async function getChildrenWithDataInSourceExplorerNode(
  context: ContextSourceExplorerNodeParams,
  { itemId }: GetChildrenWithDataInSourceExplorerNodeParams,
) {
  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAdminAccess({ userId, ...context }))) {
    return []
  }

  const ctx = await getOrganizationContext({ userId, ...context })

  if (!ctx) {
    return []
  }

  const ownerTypeCondition = ctx.organizationId
    ? eq(sourceExplorerNodes.ownerOrganizationId, ctx.organizationId)
    : eq(sourceExplorerNodes.ownerUserId, ctx.userId)

  if (itemId === 'root') {
    const childrenWithData = await db
      .select({
        id: sourceExplorerNodes.id,
        data: {
          id: sourceExplorerNodes.id,
          name: sql<string>`
            CASE
              WHEN ${sourceExplorerNodes.sourceId} IS NOT NULL
              THEN COALESCE(${sources.name}, ${sourceExplorerNodes.name})
              ELSE ${sourceExplorerNodes.name}
            END
          `.as('name'),
          sourceId: sourceExplorerNodes.sourceId,
          sourceType: sourceExplorerNodes.sourceType,
          fractionalIndex: sourceExplorerNodes.fractionalIndex,
          children: sql<string[]>`
            (SELECT COALESCE(ARRAY_AGG(id), '{}'::text[])
             FROM ${sourceExplorerNodes} child_node
             WHERE child_node.parent_id = ${sourceExplorerNodes.id}
             AND child_node.deleted_at IS NULL)
          `.as('children'),
        },
      })
      .from(sourceExplorerNodes)
      .leftJoin(sources, eq(sourceExplorerNodes.sourceId, sources.id))
      .where(
        and(
          ownerTypeCondition,
          isNull(sourceExplorerNodes.parentId),
          isNull(sourceExplorerNodes.deletedAt),
        ),
      )
      .orderBy(sql`${sourceExplorerNodes.fractionalIndex} COLLATE "C" ASC`)

    return childrenWithData || []
  }

  const childrenWithData = await db
    .select({
      id: sourceExplorerNodes.id,
      data: {
        id: sourceExplorerNodes.id,
        name: sql<string>`
          CASE
            WHEN ${sourceExplorerNodes.sourceId} IS NOT NULL
            THEN COALESCE(${sources.name}, ${sourceExplorerNodes.name})
            ELSE ${sourceExplorerNodes.name}
          END
        `.as('name'),
        sourceId: sourceExplorerNodes.sourceId,
        sourceType: sourceExplorerNodes.sourceType,
        fractionalIndex: sourceExplorerNodes.fractionalIndex,
        children: sql<string[]>`
          (SELECT COALESCE(ARRAY_AGG(id), '{}'::text[])
           FROM ${sourceExplorerNodes} child_node
           WHERE child_node.parent_id = ${sourceExplorerNodes.id}
           AND child_node.deleted_at IS NULL)
        `.as('children'),
      },
    })
    .from(sourceExplorerNodes)
    .leftJoin(sources, eq(sourceExplorerNodes.sourceId, sources.id))
    .where(
      and(
        ownerTypeCondition,
        eq(sourceExplorerNodes.parentId, itemId),
        isNull(sourceExplorerNodes.deletedAt),
      ),
    )
    .orderBy(sql`${sourceExplorerNodes.fractionalIndex} COLLATE "C" ASC`)

  return childrenWithData || []
}
