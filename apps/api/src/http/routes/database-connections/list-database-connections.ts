import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

export async function listDatabaseConnections(app: FastifyTypedInstance) {
  app.register(authenticate).get(
    '/database-connections',
    {
      schema: {
        tags: ['Database Connections'],
        description: 'Get all database connections',
        operationId: 'listDatabaseConnections',
        querystring: z.object({
          organizationId: z.string().optional(),
          organizationSlug: z.string().optional(),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              databaseConnections: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  dialect: z.enum(['postgresql', 'mysql', 'sqlite']).nullable(),
                  payload: z
                    .object({
                      host: z.string().optional(),
                      port: z.string().optional(),
                      user: z.string().optional(),
                      password: z.string().optional(),
                      database: z.string().optional(),
                      schema: z.string().optional(),
                      filePath: z.string().optional(),
                    })
                    .nullable(),
                }),
              ),
            })
            .describe('Success'),
        }),
      },
    },
    async (request) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { organizationId, organizationSlug } = request.query

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
        }),
      }

      const databaseConnections =
        await queries.context.listDatabaseConnections(context)

      return { databaseConnections }
    },
  )
}
