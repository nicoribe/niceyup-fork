import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

export async function getConversation(app: FastifyTypedInstance) {
  app.register(authenticate).get(
    '/conversations/:conversationId',
    {
      schema: {
        tags: ['Conversations'],
        description: 'Get conversation details',
        operationId: 'getConversation',
        params: z.object({
          conversationId: z.string(),
        }),
        querystring: z.object({
          organizationId: z.string().optional(),
          organizationSlug: z.string().optional(),
          teamId: z.string().optional(),
          agentId: z.string(),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              conversation: z.object({
                id: z.string(),
                title: z.string(),
              }),
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

      const { organizationId, organizationSlug, teamId, agentId } =
        request.query

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

      // let visibility = null
      // let shared = null

      // if (conversation.ownerTeamId) {
      //   visibility = 'team'

      //   shared = await db
      //     .select({
      //       id: users.id,
      //       name: users.name,
      //       email: users.email,
      //     })
      //     .from(users)
      //     .innerJoin(teamMembers, eq(users.id, teamMembers.userId))
      //     .where(eq(teamMembers.teamId, conversation.ownerTeamId))
      // } else {
      //   visibility = conversation.ownerUserId !== userId ? 'shared' : 'private'

      //   shared = await db
      //     .select({
      //       id: users.id,
      //       name: users.name,
      //       email: users.email,
      //     })
      //     .from(users)
      //     .innerJoin(
      //       conversationsToUsers,
      //       eq(users.id, conversationsToUsers.userId),
      //     )
      //     .where(eq(conversationsToUsers.conversationId, conversation.id))
      // }

      return { conversation }
    },
  )
}
