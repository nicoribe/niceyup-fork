'use server'

import { db } from '@workspace/db'
import { and, eq, inArray, isNull, sql } from '@workspace/db/orm'
import { conversationExplorerTree } from '@workspace/db/schema'
import { leaveConversations, softDeleteConversations } from './conversations'

export type ConversationExplorerType = 'private' | 'shared' | 'team'

export async function getItemInConversationExplorerTree({
  explorerType,
  itemId,
}: {
  explorerType: ConversationExplorerType
  itemId: string
}) {
  const [itemData] = await db
    .select({
      id: conversationExplorerTree.id,
      name: conversationExplorerTree.name,
      conversationId: conversationExplorerTree.conversationId,
      children: sql<string[]>`
        ARRAY(
          SELECT id 
          FROM ${conversationExplorerTree} 
          WHERE parent_id = ${conversationExplorerTree.id} AND deleted_at IS NULL
        )
      `.as('children'),
    })
    .from(conversationExplorerTree)
    .where(
      and(
        eq(conversationExplorerTree.explorerType, explorerType),
        eq(conversationExplorerTree.id, itemId),
        isNull(conversationExplorerTree.deletedAt),
      ),
    )
    .limit(1)

  return itemData || null
}

export async function getChildrenWithDataInConversationExplorerTree({
  explorerType,
  itemId,
}: {
  explorerType: ConversationExplorerType
  itemId: string
}) {
  if (itemId === 'root') {
    const childrenWithData = await db
      .select({
        id: conversationExplorerTree.id,
        data: {
          id: conversationExplorerTree.id,
          name: conversationExplorerTree.name,
          conversationId: conversationExplorerTree.conversationId,
          children: sql<string[]>`
            ARRAY(
              SELECT id 
              FROM ${conversationExplorerTree} 
              WHERE parent_id = ${conversationExplorerTree.id} AND deleted_at IS NULL
            )
          `.as('children'),
        },
      })
      .from(conversationExplorerTree)
      .where(
        and(
          eq(conversationExplorerTree.explorerType, explorerType),
          isNull(conversationExplorerTree.parentId),
          isNull(conversationExplorerTree.deletedAt),
        ),
      )

    return childrenWithData || null
  }

  const childrenWithData = await db
    .select({
      id: conversationExplorerTree.id,
      data: {
        id: conversationExplorerTree.id,
        name: conversationExplorerTree.name,
        conversationId: conversationExplorerTree.conversationId,
        children: sql<string[]>`
          ARRAY(
            SELECT id 
            FROM ${conversationExplorerTree} 
            WHERE parent_id = ${conversationExplorerTree.id} AND deleted_at IS NULL
          )
        `.as('children'),
      },
    })
    .from(conversationExplorerTree)
    .where(
      and(
        eq(conversationExplorerTree.explorerType, explorerType),
        eq(conversationExplorerTree.parentId, itemId),
        isNull(conversationExplorerTree.deletedAt),
      ),
    )

  return childrenWithData || null
}

export async function updateNameOfItemInConversationExplorerTree({
  explorerType,
  itemId,
  name,
}: {
  explorerType: ConversationExplorerType
  itemId: string
  name: string
}) {
  await db
    .update(conversationExplorerTree)
    .set({ name })
    .where(
      and(
        eq(conversationExplorerTree.explorerType, explorerType),
        eq(conversationExplorerTree.id, itemId),
        isNull(conversationExplorerTree.deletedAt),
      ),
    )
}

export async function updateParentIdOfItemsInConversationExplorerTree({
  explorerType,
  itemIds,
  parentId,
}: {
  explorerType: ConversationExplorerType
  itemIds: string[]
  parentId: string | null
}) {
  await db
    .update(conversationExplorerTree)
    .set({ parentId: parentId === 'root' ? null : parentId })
    .where(
      and(
        eq(conversationExplorerTree.explorerType, explorerType),
        inArray(conversationExplorerTree.id, itemIds),
        isNull(conversationExplorerTree.deletedAt),
      ),
    )
}

export async function deleteItemInConversationExplorerTree({
  explorerType,
  itemId,
}: {
  explorerType: ConversationExplorerType
  itemId: string
}) {
  if (explorerType === 'shared') {
    await db.execute(sql`
      WITH RECURSIVE explorerTreePath AS (
        SELECT id, conversation_id
        FROM ${conversationExplorerTree}
        WHERE id = ${itemId} 
          AND explorer_type = ${explorerType}
          AND deleted_at IS NULL
  
        UNION ALL
  
        SELECT treeNode.id, treeNode.conversation_id
        FROM ${conversationExplorerTree} treeNode
        INNER JOIN explorerTreePath parentTree ON treeNode.parent_id = parentTree.id
        WHERE treeNode.deleted_at IS NULL
      )
      UPDATE ${conversationExplorerTree}
      SET deleted_at = NOW()
      WHERE id IN (
        SELECT id FROM explorerTreePath 
        WHERE conversation_id IS NULL
      )
    `)

    const deletedConversations = await db.execute<{
      conversation_id: string
    }>(sql`
      WITH RECURSIVE explorerTreePath AS (
        SELECT id, conversation_id
        FROM ${conversationExplorerTree}
        WHERE id = ${itemId} 
          AND explorer_type = ${explorerType}
          AND deleted_at IS NULL
  
        UNION ALL
  
        SELECT treeNode.id, treeNode.conversation_id
        FROM ${conversationExplorerTree} treeNode
        INNER JOIN explorerTreePath parentTree ON treeNode.parent_id = parentTree.id
        WHERE treeNode.deleted_at IS NULL
      )
      DELETE FROM ${conversationExplorerTree}
      WHERE id IN (
        SELECT id FROM explorerTreePath 
        WHERE conversation_id IS NOT NULL
      )
      RETURNING conversation_id
    `)

    const leaveConversationIds: string[] = deletedConversations.rows
      .map((item) => item.conversation_id)
      .filter(Boolean)

    await leaveConversations(leaveConversationIds)
  } else {
    const deletedItems = await db.execute<{ conversation_id: string }>(sql`
      WITH RECURSIVE explorerTreePath AS (
        SELECT id
        FROM ${conversationExplorerTree}
        WHERE id = ${itemId} 
          AND explorer_type = ${explorerType}
          AND deleted_at IS NULL
  
        UNION ALL
  
        SELECT treeNode.id
        FROM ${conversationExplorerTree} treeNode
        INNER JOIN explorerTreePath parentTree ON treeNode.parent_id = parentTree.id
        WHERE treeNode.deleted_at IS NULL
      )
      UPDATE ${conversationExplorerTree}
      SET deleted_at = NOW()
      WHERE id IN (SELECT id FROM explorerTreePath)
      RETURNING conversation_id
    `)

    const softDeletedConversationIds: string[] = deletedItems.rows
      .map((item) => item.conversation_id)
      .filter(Boolean)

    await softDeleteConversations(softDeletedConversationIds)
  }
}

export async function createFolderInConversationExplorerTree({
  explorerType,
  parentId,
  name,
}: {
  explorerType: ConversationExplorerType
  parentId: string | null
  name: string
}) {
  const [newFolder] = await db
    .insert(conversationExplorerTree)
    .values({
      explorerType,
      parentId,
      name,
    })
    .returning({
      id: conversationExplorerTree.id,
    })

  return newFolder
}
