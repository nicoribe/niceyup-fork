import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db'
import type { ConversationVisibility } from '../../lib/types'
import { conversations } from '../../schema'
import { getAgent } from './agents'

type ContextListConversationsParams = {
  userId: string
  organizationId: string
  teamId?: string | null
}

type ListConversationsParams = {
  agentId: string
}

export async function listConversations(
  context: ContextListConversationsParams,
  params: ListConversationsParams,
) {
  const checkAccessToAgent = await getAgent(context, {
    agentId: params.agentId,
  })

  if (!checkAccessToAgent) {
    return []
  }

  // TODO: check if user has access to the conversations (private, shared, team)

  const listConversations = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      visibility: sql<ConversationVisibility>`
        CASE
          WHEN ${conversations.teamId} IS NOT NULL THEN 'team'
          WHEN ${conversations.createdByUserId} = ${context.userId} THEN 'private'
          ELSE 'shared'
        END
      `.as('visibility'),
      teamId: conversations.teamId,
      createdByUserId: conversations.createdByUserId,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.agentId, params.agentId),
        isNull(conversations.deletedAt),
      ),
    )
    .orderBy(desc(conversations.updatedAt))

  return listConversations
}

type ContextGetConversationParams = {
  userId: string
  organizationId: string
  teamId?: string | null
}

type GetConversationParams = {
  agentId: string
  conversationId: string
}

export async function getConversation(
  context: ContextGetConversationParams,
  params: GetConversationParams,
) {
  const checkAccessToAgent = await getAgent(context, {
    agentId: params.agentId,
  })

  if (!checkAccessToAgent) {
    return null
  }

  // TODO: check if user has access to the conversation (private, shared, team)

  const [conversation] = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      visibility: sql<ConversationVisibility>`
        CASE
          WHEN ${conversations.teamId} IS NOT NULL THEN 'team'
          WHEN ${conversations.createdByUserId} = ${context.userId} THEN 'private'
          ELSE 'shared'
        END
      `.as('visibility'),
      teamId: conversations.teamId,
      createdByUserId: conversations.createdByUserId,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.agentId, params.agentId),
        eq(conversations.id, params.conversationId),
        isNull(conversations.deletedAt),
      ),
    )
    .limit(1)

  return conversation || null
}
