import type { FastifyTypedInstance } from '@/types/fastify'
import { auth, toNodeHandler } from '@workspace/auth'

export async function authRoutes(app: FastifyTypedInstance) {
  const authHandler = toNodeHandler(auth.handler)

  app.addContentTypeParser('application/json', (_request, _payload, done) => {
    done(null, null)
  })

  app.route({
    method: ['GET', 'POST'],
    url: '/auth/*',
    schema: { hide: true },
    handler: async (request, reply) => {
      return await authHandler(request.raw, reply.raw)
    },
  })
}
