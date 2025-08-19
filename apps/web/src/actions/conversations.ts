'use server'

import { authenticatedUser } from '@/lib/auth/server'
import { db } from '@workspace/db'
import { and, eq, inArray, isNull } from '@workspace/db/orm'
import { conversations, conversationsToUsers } from '@workspace/db/schema'

export async function getConversation(agentId: string, conversationId: string) {
  if (conversationId === 'new') {
    return null
  }

  const [conversation] = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      agentId: conversations.agentId,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.agentId, agentId),
        eq(conversations.id, conversationId),
        isNull(conversations.deletedAt),
      ),
    )
    .limit(1)

  return conversation || null
}

export async function softDeleteConversations(conversationIds: string[]) {
  await db
    .update(conversations)
    .set({ deletedAt: new Date() })
    .where(
      and(
        inArray(conversations.id, conversationIds),
        isNull(conversations.deletedAt),
      ),
    )
}

export async function leaveConversations(conversationIds: string[]) {
  const { user } = await authenticatedUser()

  await db
    .delete(conversationsToUsers)
    .where(
      and(
        inArray(conversationsToUsers.conversationId, conversationIds),
        eq(conversationsToUsers.userId, user.id),
      ),
    )
}
