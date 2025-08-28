'use server'

import { db } from '@workspace/db'
import { and, desc, eq, isNull, sql } from '@workspace/db/orm'
import { messages } from '@workspace/db/schema'

export type MessageRole = 'data' | 'system' | 'user' | 'assistant'

export type Message = {
  id: string
  role: MessageRole
  content: string
  parent_id: string | null
  children: string[]
  created_at: Date
}

export async function listMessages({
  conversationId,
  targetMessageId,
  parents,
}: { conversationId: string; targetMessageId?: string; parents?: boolean }) {
  const [targetMessage] = await db
    .select({
      id: messages.id,
    })
    .from(messages)
    .where(
      targetMessageId
        ? and(
            eq(messages.id, targetMessageId),
            eq(messages.conversationId, conversationId),
            isNull(messages.deletedAt),
          )
        : and(
            eq(messages.conversationId, conversationId),
            isNull(messages.deletedAt),
          ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(1)

  if (!targetMessage) {
    return []
  }

  const listParents = !parents
    ? { rows: [] }
    : await db.execute<Message>(sql`
    WITH RECURSIVE message_parents AS (
      -- Base case: start with target message
      SELECT id, role, content, parent_id, created_at,
             (SELECT COALESCE(ARRAY_AGG(child.id), '{}'::text[]) 
              FROM ${messages} child 
              WHERE child.parent_id = ${messages}.id 
              AND child.deleted_at IS NULL) as children
      FROM ${messages}
      WHERE id = ${targetMessage.id}
        AND conversation_id = ${conversationId}
        AND deleted_at IS NULL
      
      UNION ALL
      
      -- Recursive case: get parents of each message in the previous level
      SELECT parent.id, parent.role, parent.content, parent.parent_id, parent.created_at,
             (SELECT COALESCE(ARRAY_AGG(child.id), '{}'::text[]) 
              FROM ${messages} child 
              WHERE child.parent_id = parent.id 
              AND child.deleted_at IS NULL) as children
      FROM ${messages} parent
      INNER JOIN message_parents mp ON parent.id = mp.parent_id
      WHERE parent.deleted_at IS NULL
    )
    SELECT id, role, content, parent_id, children, created_at
    FROM message_parents
    WHERE id != ${targetMessage.id}  -- Exclude the target message itself
    ORDER BY created_at ASC
  `)

  const listChildren = await db.execute<Message>(sql`
    WITH RECURSIVE message_children AS (
      -- Base case: start with target message
      SELECT id, role, content, parent_id, created_at,
             (SELECT COALESCE(ARRAY_AGG(child.id ORDER BY child.created_at ASC), '{}'::text[]) 
              FROM ${messages} child 
              WHERE child.parent_id = ${messages}.id 
              AND child.deleted_at IS NULL) as children
      FROM ${messages}
      WHERE id = ${targetMessage.id}
        AND conversation_id = ${conversationId}
        AND deleted_at IS NULL
      
      UNION ALL
      
      -- Recursive case: get only the first (oldest) child of each message, but keep all children in the array
      SELECT child.id, child.role, child.content, child.parent_id, child.created_at,
             (SELECT COALESCE(ARRAY_AGG(grandchild.id ORDER BY grandchild.created_at ASC), '{}'::text[]) 
              FROM ${messages} grandchild 
              WHERE grandchild.parent_id = child.id 
              AND grandchild.deleted_at IS NULL) as children
      FROM ${messages} child
      INNER JOIN message_children mc ON child.id = (
        SELECT first_child.id
        FROM ${messages} first_child
        WHERE first_child.parent_id = mc.id
        AND first_child.deleted_at IS NULL
        ORDER BY first_child.created_at ASC
        LIMIT 1
      )
      WHERE child.deleted_at IS NULL
    )
    SELECT id, role, content, parent_id, children, created_at
    FROM message_children
    ORDER BY created_at ASC
  `)

  return [...listParents.rows, ...listChildren.rows]
}
