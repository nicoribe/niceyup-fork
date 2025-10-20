import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { db } from '@workspace/db'
import { and, eq } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import {
  conversationExplorerNodes,
  conversations,
  conversationsToUsers,
} from '@workspace/db/schema'
import { z } from 'zod'

export async function deleteConversation(app: FastifyTypedInstance) {
  app.register(authenticate).delete(
    '/conversations/:conversationId',
    {
      schema: {
        tags: ['Conversations'],
        description: 'Delete a conversation',
        operationId: 'deleteConversation',
        params: z.object({
          conversationId: z.string(),
        }),
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          teamId: z.string().nullish(),
          agentId: z.string(),
          destroy: z.boolean().optional(),
        }),
        response: withDefaultErrorResponses({
          204: z.null().describe('Success'),
        }),
      },
    },
    async (request, reply) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { conversationId } = request.params

      const { organizationId, organizationSlug, teamId, agentId, destroy } =
        request.body

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

      await db.transaction(async (tx) => {
        if (userId !== conversation.ownerUserId && !conversation.ownerTeamId) {
          await tx
            .delete(conversationExplorerNodes)
            .where(
              and(
                eq(conversationExplorerNodes.conversationId, conversationId),
                eq(conversationExplorerNodes.ownerUserId, userId),
              ),
            )

          await tx
            .delete(conversationsToUsers)
            .where(
              and(
                eq(conversationsToUsers.conversationId, conversationId),
                eq(conversationsToUsers.userId, userId),
              ),
            )
        } else {
          const explorerOwnerTypeCondition = conversation.ownerTeamId
            ? eq(
                conversationExplorerNodes.ownerTeamId,
                conversation.ownerTeamId,
              )
            : eq(
                conversationExplorerNodes.ownerUserId,
                conversation.ownerUserId!,
              )

          const ownerTypeCondition = conversation.ownerTeamId
            ? eq(conversations.ownerTeamId, conversation.ownerTeamId)
            : eq(conversations.ownerUserId, conversation.ownerUserId!)

          if (destroy) {
            await tx
              .delete(conversationExplorerNodes)
              .where(
                and(
                  eq(conversationExplorerNodes.conversationId, conversationId),
                  explorerOwnerTypeCondition,
                ),
              )

            await tx
              .delete(conversations)
              .where(
                and(eq(conversations.id, conversationId), ownerTypeCondition),
              )
          } else {
            await tx
              .update(conversationExplorerNodes)
              .set({ deletedAt: new Date() })
              .where(
                and(
                  eq(conversationExplorerNodes.conversationId, conversationId),
                  explorerOwnerTypeCondition,
                ),
              )

            await tx
              .update(conversations)
              .set({ deletedAt: new Date() })
              .where(
                and(eq(conversations.id, conversationId), ownerTypeCondition),
              )
          }
        }
      })

      return reply.status(204).send()
    },
  )
}
