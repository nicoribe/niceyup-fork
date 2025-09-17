import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { conversations } from '../../schema'
import { getAgent } from './agents'

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
  conversationId: string
}

export async function getConversation(
  context: ContextGetConversationParams,
  params: GetConversationParams,
) {
  const [conversation] = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      teamId: conversations.teamId,
      ownerId: conversations.ownerId,
      agentId: conversations.agentId,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, params.conversationId),
        isNull(conversations.deletedAt),
      ),
    )
    .limit(1)

  // Check if user has access to the agent
  if (conversation?.agentId) {
    const agent = await getAgent(context, { agentId: conversation.agentId })

    if (agent) {
      return conversation
    }
  }

  return null
}
