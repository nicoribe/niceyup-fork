'use server'

import { authenticatedUser } from '@/lib/auth/server'
import type {
  ConversationExplorerType,
  MessageMetadata,
  MessagePart,
  OrganizationTeamParams,
} from '@/lib/types'
import { db } from '@workspace/db'
import { and, desc, eq, isNull, or, sql } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import {
  conversationExplorerTree,
  conversations,
  messages,
} from '@workspace/db/schema'
import { answerMessageTask } from '@workspace/engine/trigger/answer-message'

type MessagesParams = OrganizationTeamParams & {
  agentId: string
}

type SendQuestionMessageParams = {
  conversationId: string | null
  parentMessageId?: string | null
  message: {
    parts: MessagePart[]
    metadata?: MessageMetadata | null
  }
  explorerType?: ConversationExplorerType
  folderIdExplorerTree?: string
}

export async function sendQuestionMessage(
  params: MessagesParams,
  {
    conversationId,
    parentMessageId,
    message,
    explorerType = 'private',
    folderIdExplorerTree,
  }: SendQuestionMessageParams,
) {
  if (explorerType === 'team' && params.teamId === '~') {
    console.log('sendQuestionMessage', 'Team not found')
    return
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const agent = await queries.getAgent({
    userId,
    organizationSlug:
      params.organizationSlug !== 'my-account' ? params.organizationSlug : null,
    teamId: params.teamId !== '~' ? params.teamId : null,
    agentId: params.agentId,
  })

  if (!agent) {
    console.log('sendQuestionMessage', 'Agent not found')
    return
  }

  const ownerTypeCondition =
    explorerType === 'team' ? { teamId: params.teamId } : { ownerId: userId }

  if (!conversationId || conversationId === 'new') {
    const [conversation] = await db
      .insert(conversations)
      .values({
        agentId: params.agentId,
        ...ownerTypeCondition,
      })
      .returning({
        id: conversations.id,
      })

    if (!conversation) {
      console.log('sendQuestionMessage', 'Conversation not created')
      return
    }

    conversationId = conversation.id

    const [systemMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        status: 'finished',
        role: 'system',
        parts: [{ type: 'text', text: 'You are a helpful assistant.' }],
      })
      .returning({
        id: messages.id,
      })

    if (!systemMessage) {
      console.log('sendQuestionMessage', 'System message not created')
      return
    }

    parentMessageId = systemMessage.id

    await db
      .insert(conversationExplorerTree)
      .values({
        explorerType,
        agentId: params.agentId,
        ...ownerTypeCondition,
        conversationId,
        parentId: folderIdExplorerTree,
      })
      .returning({
        id: conversationExplorerTree.id,
      })
  }

  if (!parentMessageId) {
    const [parentMessage] = await db
      .select({
        id: messages.id,
      })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversationId),
          or(eq(messages.role, 'system'), eq(messages.role, 'assistant')),
          isNull(messages.deletedAt),
        ),
      )
      .orderBy(desc(messages.createdAt))
      .limit(1)

    if (!parentMessage) {
      console.log('sendQuestionMessage', 'Parent message not found')
      return
    }

    parentMessageId = parentMessage?.id
  }

  const [questionMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      status: 'finished',
      role: 'user',
      parts: message.parts,
      metadata: message.metadata,
      parentId: parentMessageId,
    })
    .returning({
      id: messages.id,
      status: messages.status,
      role: messages.role,
      parts: messages.parts,
      metadata: messages.metadata,
      parentId: messages.parentId,
    })

  if (!questionMessage) {
    console.log('sendQuestionMessage', 'Question message not created')
    return
  }

  const [answerMessage] = await db
    .insert(messages)
    .values({
      conversationId,
      status: 'queued',
      role: 'assistant',
      parts: [],
      parentId: questionMessage.id,
    })
    .returning({
      id: messages.id,
    })

  if (!answerMessage) {
    console.log('sendQuestionMessage', 'Answer message not created')
    return
  }

  const handle = await answerMessageTask.trigger({
    conversationId,
    questionMessageId: questionMessage.id,
    answerMessageId: answerMessage.id,
  })

  const metadata = { messageId: answerMessage.id, ...handle }

  const [answerMessageUpdated] = await db
    .update(messages)
    .set({
      metadata: sql`COALESCE(${messages.metadata}, '{}'::jsonb) || jsonb_build_object('realtimeRun', ${JSON.stringify(metadata)}::jsonb)`,
    })
    .where(eq(messages.id, answerMessage.id))
    .returning({
      id: messages.id,
      status: messages.status,
      role: messages.role,
      parts: messages.parts,
      metadata: messages.metadata,
      parentId: messages.parentId,
    })

  if (!answerMessageUpdated) {
    console.log('sendQuestionMessage', 'Answer message not updated')
    return
  }

  return {
    conversationId,
    questionMessage: questionMessage,
    answerMessage: answerMessageUpdated,
  }
}

export async function listMessages({
  conversationId,
  targetMessageId,
  parents,
}: { conversationId: string; targetMessageId?: string; parents?: boolean }) {
  return queries.listMessages({ conversationId, targetMessageId, parents })
}
