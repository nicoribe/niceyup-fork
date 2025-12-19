import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { conversations } from '../schema'

type ConversationParams = {
  conversationId: string
}

export async function getConversation(params: ConversationParams) {
  const [conversation] = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      agentId: conversations.agentId,
      teamId: conversations.teamId,
      createdByUserId: conversations.createdByUserId,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.id, params.conversationId),
        isNull(conversations.deletedAt),
      ),
    )
    .limit(1)

  return conversation || null
}
