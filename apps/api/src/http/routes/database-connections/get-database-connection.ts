import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

export async function getDatabaseConnection(app: FastifyTypedInstance) {
  app.register(authenticate).get(
    '/database-connections/:databaseConnectionId',
    {
      schema: {
        tags: ['Database Connections'],
        description: 'Get database connection details',
        operationId: 'getDatabaseConnection',
        params: z.object({
          databaseConnectionId: z.string(),
        }),
        querystring: z.object({
          organizationId: z.string().optional(),
          organizationSlug: z.string().optional(),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              databaseConnection: z.object({
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
            })
            .describe('Success'),
        }),
      },
    },
    async (request) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { databaseConnectionId } = request.params

      const { organizationId, organizationSlug } = request.query

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
        }),
      }

      const databaseConnection = await queries.context.getDatabaseConnection(
        context,
        { databaseConnectionId },
      )

      if (!databaseConnection) {
        throw new BadRequestError({
          code: 'DATABASE_CONNECTION_NOT_FOUND',
          message: 'Database connection not found or you don’t have access',
        })
      }

      return { databaseConnection }
    },
  )
}
