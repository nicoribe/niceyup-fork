import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { getMembershipContext } from '@/http/functions/membership'
import { authenticate } from '@/http/middlewares/authenticate'
import type { FastifyTypedInstance } from '@/types/fastify'
import { db } from '@workspace/db'
import { connections } from '@workspace/db/schema'
import { z } from 'zod'

export async function createConnection(app: FastifyTypedInstance) {
  app.register(authenticate).post(
    '/connections',
    {
      schema: {
        tags: ['Connections'],
        description: 'Create a new connection',
        operationId: 'createConnection',
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          app: z.string(),
          name: z.string(),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              connectionId: z.string(),
            })
            .describe('Success'),
        }),
      },
    },
    async (request, reply) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { organizationId, organizationSlug, app, name } = request.body

      const { context } = await getMembershipContext({
        userId,
        organizationId,
        organizationSlug,
      })

      // TODO: implement app validation

      const [connection] = await db
        .insert(connections)
        .values({
          app,
          name,
          organizationId: context.organizationId,
        })
        .returning({
          id: connections.id,
        })

      if (!connection) {
        throw new BadRequestError({
          code: 'CONNECTION_NOT_CREATED',
          message: 'Connection not created',
        })
      }

      return reply.status(201).send({
        connectionId: connection.id,
      })
    },
  )
}
