import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
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
        response: withDefaultErrorResponses({
          200: z
            .object({
              conversation: z.object({
                id: z.string(),
                title: z.string(),
                agentId: z.string().nullable(),
              }),
            })
            .describe('Success'),
        }),
      },
    },
    async (request) => {
      const {
        session: { activeOrganizationId: organizationId, activeTeamId: teamId },
        user: { id: userId },
      } = request.authSession

      const { conversationId } = request.params

      const conversation = await queries.getConversation({ conversationId })

      let agent = undefined
      if (conversation?.agentId) {
        agent = await queries.getAgent(
          { userId, organizationId, teamId },
          { agentId: conversation.agentId },
        )
      }

      if (!conversation || !agent) {
        throw new BadRequestError({
          code: 'CONVERSATION_NOT_FOUND',
          message: 'Conversation not found or you don’t have access',
        })
      }

      return { conversation }
    },
  )
}
