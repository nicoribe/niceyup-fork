import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

export async function listAgents(app: FastifyTypedInstance) {
  app.register(authenticate).get(
    '/agents',
    {
      schema: {
        tags: ['Agents'],
        description: 'Get all agents',
        operationId: 'listAgents',
        response: withDefaultErrorResponses({
          200: z
            .object({
              agents: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                }),
              ),
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

      const agents = await queries.listAgents({
        userId,
        organizationId,
        teamId,
      })

      return { agents }
    },
  )
}
