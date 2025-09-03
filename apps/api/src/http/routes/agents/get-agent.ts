import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

export async function getAgent(app: FastifyTypedInstance) {
  app.register(authenticate).get(
    '/agents/:agentId',
    {
      schema: {
        tags: ['Agents'],
        description: 'Get agent details',
        operationId: 'getAgent',
        params: z.object({
          agentId: z.string(),
        }),
        querystring: z.object({
          organizationId: z.string().optional(),
          organizationSlug: z.string().optional(),
          teamId: z.string().optional(),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              agent: z.object({
                id: z.string(),
                name: z.string(),
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

      const { agentId } = request.params

      const { organizationId, organizationSlug, teamId } = request.query

      const agent = await queries.getAgent({
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
          teamId,
        }),
        agentId,
      })

      if (!agent) {
        throw new BadRequestError({
          code: 'AGENT_UNAVAILABLE',
          message: 'Agent not found or you don’t have access',
        })
      }

      return { agent }
    },
  )
}
