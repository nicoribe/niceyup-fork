import { db } from '../db'
import { and, desc, eq, isNull, sql } from '../orm'
import { messages } from '../schema'
import type {
  MessageMetadata,
  MessagePart,
  MessageRole,
  MessageStatus,
} from '../types'

type Message = {
  id: string
  status: MessageStatus
  role: MessageRole
  parts: MessagePart[] | null
  metadata: MessageMetadata | null
  parentId?: string | null
  children?: string[]
}

export async function getMessage({
  messageId,
}: {
  messageId: string
}) {
  const [message] = await db
    .select({
      id: messages.id,
      status: messages.status,
      role: messages.role,
      parts: messages.parts,
      metadata: messages.metadata,
      parentId: messages.parentId,
    })
    .from(messages)
    .where(eq(messages.id, messageId))
    .limit(1)

  return message || null
}

export async function updateMessage({
  messageId,
  status,
  parts,
  metadata,
}: {
  messageId: string
  status?: MessageStatus
  parts?: MessagePart[]
  metadata?: MessageMetadata
}) {
  await db
    .update(messages)
    .set({
      status,
      parts,
      metadata: metadata
        ? sql`COALESCE(${messages.metadata}, '{}'::jsonb) || jsonb_build_object('realtimeRun', ${JSON.stringify(metadata)}::jsonb)`
        : messages.metadata,
    })
    .where(eq(messages.id, messageId))
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
    console.log('listMessages', 'Target message not found')
    return []
  }

  const listParents = !parents
    ? { rows: [] }
    : await db.execute<Message>(sql`
    WITH RECURSIVE message_parents AS (
      -- Base case: start with target message
      SELECT id, status, role, parts, metadata, parent_id, created_at,
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
      SELECT parent.id, parent.status, parent.role, parent.parts, parent.metadata, parent.parent_id, parent.created_at,
             (SELECT COALESCE(ARRAY_AGG(child.id), '{}'::text[]) 
              FROM ${messages} child 
              WHERE child.parent_id = parent.id 
              AND child.deleted_at IS NULL) as children
      FROM ${messages} parent
      INNER JOIN message_parents mp ON parent.id = mp.parent_id
      WHERE parent.deleted_at IS NULL
    )
    SELECT id, status, role, parts, metadata, parent_id as "parentId", children, created_at as "createdAt"
    FROM message_parents
    WHERE id != ${targetMessage.id}  -- Exclude the target message itself
    ORDER BY created_at ASC
  `)

  const listChildren = await db.execute<Message>(sql`
    WITH RECURSIVE message_children AS (
      -- Base case: start with target message
      SELECT id, status, role, parts, metadata, parent_id, created_at,
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
      SELECT child.id, child.status, child.role, child.parts, child.metadata, child.parent_id, child.created_at,
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
    SELECT id, status, role, parts, metadata, parent_id as "parentId", children, created_at as "createdAt"
    FROM message_children
    ORDER BY created_at ASC
  `)

  return [...listParents.rows, ...listChildren.rows]
}
