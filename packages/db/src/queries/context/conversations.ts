import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { conversations } from '../../schema'
import { getAgent } from './agents'

type ContextListConversationsParams = {
  userId: string
} & (
  | {
      organizationId?: string | null
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug?: string | null
    }
) & {
    teamId?: string | null
  }

type ListConversationsParams = {
  agentId: string
}

export async function listConversations(
  context: ContextListConversationsParams,
  params: ListConversationsParams,
) {
  // Check if user has access to the agent
  const agent = await getAgent(context, { agentId: params.agentId })

  if (!agent) {
    return []
  }

  // TODO: check if user has access to the conversations (private, shared, team)

  const listConversations = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      ownerTeamId: conversations.ownerTeamId,
      ownerUserId: conversations.ownerUserId,
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
} & (
  | {
      organizationId?: string | null
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug?: string | null
    }
) & {
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
      ownerTeamId: conversations.ownerTeamId,
      ownerUserId: conversations.ownerUserId,
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
