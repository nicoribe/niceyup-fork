import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { conversationPubSub } from '@/http/realtime/pub-sub/conversation-pub-sub'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import {
  aiMessageMetadataSchema,
  aiMessagePartSchema,
  aiMessageRoleSchema,
  aiMessageStatusSchema,
} from '@workspace/ai/schemas'
import type { AIMessageMetadata } from '@workspace/ai/types'
import { db } from '@workspace/db'
import { and, eq, isNull, sql } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import { messages } from '@workspace/db/schema'
import { answerMessageTask } from '@workspace/engine/trigger/answer-message'
import { z } from 'zod'

const messageSchema = z.object({
  id: z.string(),
  status: aiMessageStatusSchema,
  role: aiMessageRoleSchema,
  parts: z.array(aiMessagePartSchema).nullable(),
  metadata: aiMessageMetadataSchema.nullable(),
  authorId: z.string().nullish(),
  parentId: z.string().nullish(),
  children: z.array(z.string()).optional(),
})

export async function regenerateAnswerMessage(app: FastifyTypedInstance) {
  app.register(authenticate).post(
    '/conversations/:conversationId/messages/regenerate-answer',
    {
      schema: {
        tags: ['Conversations'],
        description: 'Regenerate an answer message to a conversation',
        operationId: 'regenerateAnswerMessage',
        params: z.object({
          conversationId: z.string(),
        }),
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          teamId: z.string().nullish(),
          agentId: z.string(),
          parentMessageId: z.string(),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              answerMessage: messageSchema,
            })
            .describe('Success'),
        }),
      },
    },
    async (request) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { conversationId } = request.params

      const {
        organizationId,
        organizationSlug,
        teamId,
        agentId,
        parentMessageId,
      } = request.body

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
          teamId,
        }),
      }

      const conversation = await queries.context.getConversation(context, {
        agentId,
        conversationId,
      })

      if (!conversation) {
        throw new BadRequestError({
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found or you don’t have access',
        })
      }

      const [parentMessage] = await db
        .select({
          id: messages.id,
        })
        .from(messages)
        .where(
          and(
            eq(messages.conversationId, conversationId),
            eq(messages.id, parentMessageId),
            isNull(messages.deletedAt),
          ),
        )
        .limit(1)

      if (!parentMessage) {
        throw new BadRequestError({
          code: 'PARENT_MESSAGE_NOT_FOUND',
          message: 'Parent message not found',
        })
      }

      const { answerMessage } = await db.transaction(async (tx) => {
        const [answerMessage] = await tx
          .insert(messages)
          .values({
            conversationId,
            status: 'queued',
            role: 'assistant',
            parts: [],
            parentId: parentMessage.id,
          })
          .returning({
            id: messages.id,
          })

        if (!answerMessage) {
          throw new BadRequestError({
            code: 'ANSWER_MESSAGE_NOT_CREATED',
            message: 'Answer message not created',
          })
        }

        const handle = await answerMessageTask.trigger({
          conversationId,
          questionMessageId: parentMessage.id,
          answerMessageId: answerMessage.id,
        })

        const metadata: AIMessageMetadata = {
          triggerTask: {
            id: handle.id,
            taskIdentifier: handle.taskIdentifier,
          },
          authorId: userId,
        }

        const [answerMessageUpdated] = await tx
          .update(messages)
          .set({
            metadata: sql`COALESCE(${messages.metadata}, '{}'::jsonb) || ${JSON.stringify(metadata)}::jsonb`,
          })
          .where(eq(messages.id, answerMessage.id))
          .returning({
            id: messages.id,
            status: messages.status,
            role: messages.role,
            parts: messages.parts,
            metadata: messages.metadata,
            authorId: messages.authorId,
            parentId: messages.parentId,
          })

        if (!answerMessageUpdated) {
          throw new BadRequestError({
            code: 'ANSWER_MESSAGE_NOT_UPDATED',
            message: 'Answer message not updated',
          })
        }

        return {
          answerMessage: {
            ...answerMessageUpdated,
            children: [],
          },
        }
      })

      conversationPubSub.publish({
        channel: `conversations:${conversationId}:updated`,
        messages: [answerMessage],
      })

      return { answerMessage }
    },
  )
}
