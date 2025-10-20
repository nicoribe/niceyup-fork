import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { messages } from '../../schema'
import { getConversation } from './conversations'

type ContextGetMessageParams = {
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

type GetMessageParams = {
  agentId: string
  conversationId: string
  messageId: string
}

export async function getMessage(
  context: ContextGetMessageParams,
  params: GetMessageParams,
) {
  const conversation = await getConversation(context, {
    agentId: params.agentId,
    conversationId: params.conversationId,
  })

  // Check if user has access to the conversation
  if (!conversation) {
    return null
  }

  const [message] = await db
    .select({
      id: messages.id,
      status: messages.status,
      role: messages.role,
      parts: messages.parts,
      metadata: messages.metadata,
      authorId: messages.authorId,
      parentId: messages.parentId,
    })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, params.conversationId),
        eq(messages.id, params.messageId),
        isNull(messages.deletedAt),
      ),
    )
    .limit(1)

  return message || null
}
