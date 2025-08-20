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
      WITH RECURSIVE explorer_tree_path AS (
        SELECT id, conversation_id
        FROM ${conversationExplorerTree}
        WHERE id = ${itemId} 
          AND explorer_type = ${explorerType}
          AND deleted_at IS NULL
  
        UNION ALL
  
        SELECT tree_node.id, tree_node.conversation_id
        FROM ${conversationExplorerTree} tree_node
        INNER JOIN explorer_tree_path parent_tree ON tree_node.parent_id = parent_tree.id
        WHERE tree_node.deleted_at IS NULL
      )
      UPDATE ${conversationExplorerTree}
      SET deleted_at = NOW()
      WHERE id IN (
        SELECT id FROM explorer_tree_path 
        WHERE conversation_id IS NULL
      )
    `)

    const deletedConversations = await db.execute<{
      conversation_id: string
    }>(sql`
      WITH RECURSIVE explorer_tree_path AS (
        SELECT id, conversation_id
        FROM ${conversationExplorerTree}
        WHERE id = ${itemId} 
          AND explorer_type = ${explorerType}
          AND deleted_at IS NULL
  
        UNION ALL
  
        SELECT tree_node.id, tree_node.conversation_id
        FROM ${conversationExplorerTree} tree_node
        INNER JOIN explorer_tree_path parent_tree ON tree_node.parent_id = parent_tree.id
        WHERE tree_node.deleted_at IS NULL
      )
      DELETE FROM ${conversationExplorerTree}
      WHERE id IN (
        SELECT id FROM explorer_tree_path 
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
      WITH RECURSIVE explorer_tree_path AS (
        SELECT id
        FROM ${conversationExplorerTree}
        WHERE id = ${itemId} 
          AND explorer_type = ${explorerType}
          AND deleted_at IS NULL
  
        UNION ALL
  
        SELECT tree_node.id
        FROM ${conversationExplorerTree} tree_node
        INNER JOIN explorer_tree_path parent_tree ON tree_node.parent_id = parent_tree.id
        WHERE tree_node.deleted_at IS NULL
      )
      UPDATE ${conversationExplorerTree}
      SET deleted_at = NOW()
      WHERE id IN (SELECT id FROM explorer_tree_path)
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

export async function getParentsInConversationExplorerTree({
  explorerType,
  itemId,
  conversationId,
}: {
  explorerType: ConversationExplorerType
} & (
  | {
      itemId: string
      conversationId?: never
    }
  | {
      itemId?: never
      conversationId: string
    }
)) {
  if (!itemId && !conversationId) {
    throw new Error('itemId or conversationId is required')
  }

  const parents = await db.execute<{
    id: string
    name: string
    explorer_type: ConversationExplorerType
    parent_id: string | null
    conversation_id: string | null
    deleted_at: string | null
    level: number
  }>(sql`
    WITH RECURSIVE explorer_tree_path AS (
      SELECT tree_node.id,
             tree_node.name,
             tree_node.explorer_type,
             tree_node.parent_id,
             tree_node.conversation_id,
             tree_node.deleted_at,
             0 AS level
      FROM ${conversationExplorerTree} tree_node
      WHERE ${conversationId ? sql`tree_node.conversation_id = ${conversationId}` : sql`tree_node.id = ${itemId}`}
        AND tree_node.explorer_type = ${explorerType}
      
      UNION ALL
      
      SELECT parent_node.id,
             parent_node.name,
             parent_node.explorer_type,
             parent_node.parent_id,
             parent_node.conversation_id,
             parent_node.deleted_at,
             explorer_tree_path.level + 1 AS level
      FROM ${conversationExplorerTree} parent_node
      INNER JOIN explorer_tree_path ON parent_node.id = explorer_tree_path.parent_id
    )
    SELECT id,
           name,
           explorer_type,
           parent_id,
           conversation_id,
           deleted_at,
           level
    FROM explorer_tree_path
    ORDER BY level DESC
  `)

  return parents.rows
}
