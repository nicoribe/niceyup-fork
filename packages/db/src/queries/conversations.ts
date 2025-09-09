import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { conversations } from '../schema'

export async function getConversation({
  conversationId,
}: { conversationId: string }) {
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
        eq(conversations.id, conversationId),
        isNull(conversations.deletedAt),
      ),
    )
    .limit(1)

  return conversation || null
}
