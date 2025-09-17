'use server'

import { authenticatedUser } from '@/lib/auth/server'
import type {
  ConversationExplorerType,
  OrganizationTeamParams,
} from '@/lib/types'
import { db } from '@workspace/db'
import { and, eq, inArray, isNull, sql } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import {
  conversationExplorerTree,
  conversations,
  conversationsToUsers,
} from '@workspace/db/schema'

type ContextConversationExplorerTreeParams = OrganizationTeamParams & {
  agentId: string
}

async function checkAccessToAgent(
  context: { userId: string } & ContextConversationExplorerTreeParams,
) {
  const agent = await queries.context.getAgent(
    {
      userId: context.userId,
      organizationSlug:
        context.organizationSlug !== 'my-account'
          ? context.organizationSlug
          : null,
      teamId: context.teamId !== '~' ? context.teamId : null,
    },
    { agentId: context.agentId },
  )

  return Boolean(agent)
}

type GetItemInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
  itemId: string
}

export async function getItemInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  { explorerType, itemId }: GetItemInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return null
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return null
  }

  const ownerTypeCondition =
    explorerType === 'team'
      ? eq(conversationExplorerTree.teamId, context.teamId)
      : eq(conversationExplorerTree.ownerId, userId)

  const [itemData] = await db
    .select({
      id: conversationExplorerTree.id,
      name: sql<string>`
        CASE 
          WHEN ${conversationExplorerTree.conversationId} IS NOT NULL 
          THEN COALESCE(${conversations.title}, ${conversationExplorerTree.name})
          ELSE ${conversationExplorerTree.name}
        END
      `.as('name'),
      conversationId: conversationExplorerTree.conversationId,
      children: sql<string[]>`
        (SELECT COALESCE(ARRAY_AGG(id), '{}'::text[]) 
         FROM ${conversationExplorerTree} child 
         WHERE child.parent_id = ${conversationExplorerTree.id} 
         AND child.deleted_at IS NULL)
      `.as('children'),
    })
    .from(conversationExplorerTree)
    .leftJoin(
      conversations,
      eq(conversationExplorerTree.conversationId, conversations.id),
    )
    .where(
      and(
        eq(conversationExplorerTree.explorerType, explorerType),
        eq(conversationExplorerTree.agentId, context.agentId),
        ownerTypeCondition,
        eq(conversationExplorerTree.id, itemId),
        isNull(conversationExplorerTree.deletedAt),
      ),
    )
    .limit(1)

  return itemData || null
}

type GetChildrenWithDataInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
  itemId: string
}

export async function getChildrenWithDataInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  { explorerType, itemId }: GetChildrenWithDataInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return []
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return []
  }

  const ownerTypeCondition =
    explorerType === 'team'
      ? eq(conversationExplorerTree.teamId, context.teamId)
      : eq(conversationExplorerTree.ownerId, userId)

  if (itemId === 'root') {
    const childrenWithData = await db
      .select({
        id: conversationExplorerTree.id,
        data: {
          id: conversationExplorerTree.id,
          name: sql<string>`
            CASE 
              WHEN ${conversationExplorerTree.conversationId} IS NOT NULL 
              THEN COALESCE(${conversations.title}, ${conversationExplorerTree.name})
              ELSE ${conversationExplorerTree.name}
            END
          `.as('name'),
          conversationId: conversationExplorerTree.conversationId,
          children: sql<string[]>`
            (SELECT COALESCE(ARRAY_AGG(id), '{}'::text[]) 
             FROM ${conversationExplorerTree} child 
             WHERE child.parent_id = ${conversationExplorerTree.id} 
             AND child.deleted_at IS NULL)
          `.as('children'),
        },
      })
      .from(conversationExplorerTree)
      .leftJoin(
        conversations,
        eq(conversationExplorerTree.conversationId, conversations.id),
      )
      .where(
        and(
          eq(conversationExplorerTree.explorerType, explorerType),
          eq(conversationExplorerTree.agentId, context.agentId),
          ownerTypeCondition,
          isNull(conversationExplorerTree.parentId),
          isNull(conversationExplorerTree.deletedAt),
        ),
      )

    return childrenWithData || []
  }

  const childrenWithData = await db
    .select({
      id: conversationExplorerTree.id,
      data: {
        id: conversationExplorerTree.id,
        name: sql<string>`
          CASE 
            WHEN ${conversationExplorerTree.conversationId} IS NOT NULL 
            THEN COALESCE(${conversations.title}, ${conversationExplorerTree.name})
            ELSE ${conversationExplorerTree.name}
          END
        `.as('name'),
        conversationId: conversationExplorerTree.conversationId,
        children: sql<string[]>`
          (SELECT COALESCE(ARRAY_AGG(id), '{}'::text[]) 
           FROM ${conversationExplorerTree} child 
           WHERE child.parent_id = ${conversationExplorerTree.id} 
           AND child.deleted_at IS NULL)
        `.as('children'),
      },
    })
    .from(conversationExplorerTree)
    .leftJoin(
      conversations,
      eq(conversationExplorerTree.conversationId, conversations.id),
    )
    .where(
      and(
        eq(conversationExplorerTree.explorerType, explorerType),
        eq(conversationExplorerTree.agentId, context.agentId),
        ownerTypeCondition,
        eq(conversationExplorerTree.parentId, itemId),
        isNull(conversationExplorerTree.deletedAt),
      ),
    )

  return childrenWithData || []
}

type GetParentsInConversationExplorerTreeParams = {
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
)

export async function getParentsInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  {
    explorerType,
    itemId,
    conversationId,
  }: GetParentsInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return []
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return []
  }

  const itemTypeCondition = conversationId
    ? sql`tree_node.conversation_id = ${conversationId}`
    : sql`tree_node.id = ${itemId}`

  const ownerTypeCondition =
    explorerType === 'team'
      ? sql`tree_node.team_id = ${context.teamId}`
      : sql`tree_node.owner_id = ${userId}`

  const parents = await db.execute<{
    id: string
    name: string
    parent_id: string | null
    conversation_id: string | null
    deleted_at: string | null
    level: number
  }>(sql`
    WITH RECURSIVE explorer_tree_path AS (
      SELECT tree_node.id,
             CASE 
               WHEN tree_node.conversation_id IS NOT NULL 
               THEN COALESCE(conv.title, tree_node.name)
               ELSE tree_node.name
             END AS name,
             tree_node.parent_id,
             tree_node.conversation_id,
             tree_node.deleted_at,
             0 AS level
      FROM ${conversationExplorerTree} tree_node
      LEFT JOIN ${conversations} conv ON tree_node.conversation_id = conv.id
      WHERE ${itemTypeCondition}
        AND tree_node.explorer_type = ${explorerType}
        AND tree_node.agent_id = ${context.agentId}
        AND ${ownerTypeCondition}
      UNION ALL
      
      SELECT parent_node.id,
             parent_node.name,
             parent_node.parent_id,
             parent_node.conversation_id,
             parent_node.deleted_at,
             explorer_tree_path.level + 1 AS level
      FROM ${conversationExplorerTree} parent_node
      INNER JOIN explorer_tree_path ON parent_node.id = explorer_tree_path.parent_id
    )
    SELECT id,
           name,
           parent_id,
           conversation_id,
           deleted_at,
           level
    FROM explorer_tree_path
    ORDER BY level DESC
  `)

  return parents.rows
}

type UpdateNameOfItemInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
  name: string
} & (
  | {
      itemId: string
      conversationId?: never
    }
  | {
      itemId?: never
      conversationId: string
    }
)

export async function updateNameOfItemInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  {
    explorerType,
    itemId,
    conversationId,
    name,
  }: UpdateNameOfItemInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return
  }

  if (conversationId !== undefined) {
    const ownerTypeCondition =
      explorerType === 'team'
        ? eq(conversations.teamId, context.teamId)
        : eq(conversations.ownerId, userId)

    await db
      .update(conversations)
      .set({ title: name })
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.agentId, context.agentId),
          ownerTypeCondition,
          isNull(conversations.deletedAt),
        ),
      )

    return
  }

  const ownerTypeCondition =
    explorerType === 'team'
      ? eq(conversationExplorerTree.teamId, context.teamId)
      : eq(conversationExplorerTree.ownerId, userId)

  await db
    .update(conversationExplorerTree)
    .set({ name })
    .where(
      and(
        eq(conversationExplorerTree.explorerType, explorerType),
        eq(conversationExplorerTree.agentId, context.agentId),
        ownerTypeCondition,
        eq(conversationExplorerTree.id, itemId),
        isNull(conversationExplorerTree.deletedAt),
      ),
    )
}

type UpdateParentIdOfItemsInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
  itemIds: string[]
  parentId: string | null
}

export async function updateParentIdOfItemsInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  {
    explorerType,
    itemIds,
    parentId,
  }: UpdateParentIdOfItemsInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return
  }

  const ownerTypeCondition =
    explorerType === 'team'
      ? eq(conversationExplorerTree.teamId, context.teamId)
      : eq(conversationExplorerTree.ownerId, userId)

  await db
    .update(conversationExplorerTree)
    .set({ parentId: parentId === 'root' ? null : parentId })
    .where(
      and(
        eq(conversationExplorerTree.explorerType, explorerType),
        eq(conversationExplorerTree.agentId, context.agentId),
        ownerTypeCondition,
        inArray(conversationExplorerTree.id, itemIds),
        isNull(conversationExplorerTree.deletedAt),
      ),
    )
}

type CreateFolderInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
  parentId: string | null
  name: string
}

export async function createFolderInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  {
    explorerType,
    parentId,
    name,
  }: CreateFolderInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return null
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return null
  }

  const ownerTypeCondition =
    explorerType === 'team' ? { teamId: context.teamId } : { ownerId: userId }

  const [newFolder] = await db
    .insert(conversationExplorerTree)
    .values({
      explorerType,
      agentId: context.agentId,
      ...ownerTypeCondition,
      parentId: parentId === 'root' ? null : parentId,
      name,
    })
    .returning({
      id: conversationExplorerTree.id,
    })

  return newFolder || null
}

type DeleteItemInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
  itemId: string
}

export async function deleteItemInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  { explorerType, itemId }: DeleteItemInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return
  }

  const ownerTypeCondition =
    explorerType === 'team'
      ? sql`team_id = ${context.teamId}`
      : sql`owner_id = ${userId}`

  if (explorerType === 'shared') {
    const deletedConversations = await db.execute<{
      conversation_id: string
    }>(sql`
      WITH RECURSIVE explorer_tree_path AS (
        SELECT id, conversation_id
        FROM ${conversationExplorerTree}
        WHERE id = ${itemId}
          AND explorer_type = ${explorerType}
          AND agent_id = ${context.agentId}
          AND ${ownerTypeCondition}
          AND deleted_at IS NULL
  
        UNION ALL
  
        SELECT tree_node.id, tree_node.conversation_id
        FROM ${conversationExplorerTree} tree_node
        INNER JOIN explorer_tree_path parent_tree ON tree_node.parent_id = parent_tree.id
        WHERE tree_node.deleted_at IS NULL
      ),
      updated_items AS (
        UPDATE ${conversationExplorerTree}
        SET deleted_at = NOW()
        WHERE EXISTS (
          SELECT 1 FROM explorer_tree_path 
          WHERE explorer_tree_path.id = ${conversationExplorerTree}.id
            AND explorer_tree_path.conversation_id IS NULL
        )
      ),
      deleted_conversations AS (
        DELETE FROM ${conversationExplorerTree}
        WHERE EXISTS (
          SELECT 1 FROM explorer_tree_path 
          WHERE explorer_tree_path.id = ${conversationExplorerTree}.id
            AND explorer_tree_path.conversation_id IS NOT NULL
        )
        RETURNING conversation_id
      )
      SELECT conversation_id FROM deleted_conversations
    `)

    const leaveConversationIds: string[] = deletedConversations.rows
      .map(({ conversation_id }) => conversation_id)
      .filter(Boolean)

    if (leaveConversationIds.length) {
      await db
        .delete(conversationsToUsers)
        .where(
          and(
            inArray(conversationsToUsers.conversationId, leaveConversationIds),
            eq(conversationsToUsers.userId, userId),
          ),
        )
    }
  } else {
    const deletedItems = await db.execute<{ conversation_id: string }>(sql`
      WITH RECURSIVE explorer_tree_path AS (
        SELECT id
        FROM ${conversationExplorerTree}
        WHERE id = ${itemId}
          AND explorer_type = ${explorerType}
          AND agent_id = ${context.agentId}
          AND ${ownerTypeCondition}
          AND deleted_at IS NULL
  
        UNION ALL
  
        SELECT tree_node.id
        FROM ${conversationExplorerTree} tree_node
        INNER JOIN explorer_tree_path parent_tree ON tree_node.parent_id = parent_tree.id
        WHERE tree_node.deleted_at IS NULL
      )
      UPDATE ${conversationExplorerTree}
      SET deleted_at = NOW()
      WHERE EXISTS (
        SELECT 1 FROM explorer_tree_path 
        WHERE explorer_tree_path.id = ${conversationExplorerTree}.id
      )
      RETURNING conversation_id
    `)

    const deletedConversationIds: string[] = deletedItems.rows
      .map(({ conversation_id }) => conversation_id)
      .filter(Boolean)

    if (deletedConversationIds.length) {
      await db
        .update(conversations)
        .set({ deletedAt: new Date() })
        .where(
          and(
            inArray(conversations.id, deletedConversationIds),
            isNull(conversations.deletedAt),
          ),
        )
    }
  }
}

type GetItemsDeletedInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
}

export async function getItemsDeletedInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  { explorerType }: GetItemsDeletedInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return []
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return []
  }

  const ownerTypeCondition =
    explorerType === 'team'
      ? sql`team_id = ${context.teamId}`
      : sql`owner_id = ${userId}`

  const deletedItems = await db.execute<{
    id: string
    name: string | null
    conversation_id: string | null
    parent_id: string | null
    deleted_at: Date
  }>(sql`
    SELECT DISTINCT ON (deleted_at)
      tree.id,
      CASE 
        WHEN tree.conversation_id IS NOT NULL THEN COALESCE(conv.title, tree.name)
        ELSE tree.name
      END as name,
      tree.conversation_id,
      tree.parent_id,
      tree.deleted_at
    FROM ${conversationExplorerTree} tree
    LEFT JOIN ${conversations} conv ON tree.conversation_id = conv.id
    WHERE tree.agent_id = ${context.agentId}
      AND tree.explorer_type = ${explorerType}
      AND ${ownerTypeCondition}
      AND tree.deleted_at IS NOT NULL
      AND (tree.parent_id IS NULL OR NOT EXISTS (
        SELECT 1 FROM ${conversationExplorerTree} parent
        WHERE parent.id = tree.parent_id 
          AND parent.agent_id = ${context.agentId} 
          AND parent.explorer_type = ${explorerType} 
          AND parent.deleted_at IS NOT NULL
      ))
    ORDER BY tree.deleted_at DESC
  `)

  return deletedItems.rows || []
}

type RestoreItemInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
  itemId: string
}

export async function restoreItemInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  { explorerType, itemId }: RestoreItemInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return
  }

  const ownerTypeCondition =
    explorerType === 'team'
      ? sql`team_id = ${context.teamId}`
      : sql`owner_id = ${userId}`

  await db.execute(sql`
    WITH RECURSIVE explorer_tree_path AS (
      SELECT id, conversation_id, deleted_at
      FROM ${conversationExplorerTree}
      WHERE id = ${itemId}
        AND explorer_type = ${explorerType}
        AND agent_id = ${context.agentId}
        AND ${ownerTypeCondition}
        AND deleted_at IS NOT NULL
      
      UNION ALL
      
      SELECT tree_node.id, tree_node.conversation_id, tree_node.deleted_at
      FROM ${conversationExplorerTree} tree_node
      INNER JOIN explorer_tree_path parent_tree ON tree_node.parent_id = parent_tree.id
      WHERE tree_node.deleted_at = explorer_tree_path.deleted_at
        AND tree_node.deleted_at IS NOT NULL
    ),
    restored_items AS (
      UPDATE ${conversationExplorerTree}
      SET deleted_at = NULL
      WHERE EXISTS (
        SELECT 1 FROM explorer_tree_path 
        WHERE explorer_tree_path.id = ${conversationExplorerTree}.id
      )
    ),
    restored_conversations AS (
      UPDATE ${conversations}
      SET deleted_at = NULL
      WHERE EXISTS (
        SELECT 1 FROM explorer_tree_path 
        WHERE explorer_tree_path.conversation_id = ${conversations}.id
          AND explorer_tree_path.conversation_id IS NOT NULL
      )
        AND agent_id = ${context.agentId}
        AND deleted_at IS NOT NULL
    )
  `)
}

type DestroyItemInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
  itemId: string
}

export async function destroyItemInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  { explorerType, itemId }: DestroyItemInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return
  }

  const ownerTypeCondition =
    explorerType === 'team'
      ? sql`team_id = ${context.teamId}`
      : sql`owner_id = ${userId}`

  console.log({
    itemId,
    explorerType,
    agentId: context.agentId,
    ...ownerTypeCondition,
  })

  throw new Error('Not implemented')
}

type DestroyAllItemsInConversationExplorerTreeParams = {
  explorerType: ConversationExplorerType
}

export async function destroyAllItemsInConversationExplorerTree(
  context: ContextConversationExplorerTreeParams,
  { explorerType }: DestroyAllItemsInConversationExplorerTreeParams,
) {
  if (explorerType === 'team' && context.teamId === '~') {
    return
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  if (!(await checkAccessToAgent({ userId, ...context }))) {
    return
  }

  const ownerTypeCondition =
    explorerType === 'team'
      ? sql`team_id = ${context.teamId}`
      : sql`owner_id = ${userId}`

  console.log({
    explorerType,
    agentId: context.agentId,
    ...ownerTypeCondition,
  })

  throw new Error('Not implemented')
}
