import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import type { FastifyTypedInstance } from '@/types/fastify'
import { auth, fromNodeHeaders } from '@workspace/auth'
import { fastifyPlugin } from 'fastify-plugin'

export const authenticate = fastifyPlugin(async (app: FastifyTypedInstance) => {
  app.addHook('preHandler', async (request) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })

    if (!session) {
      throw new UnauthorizedError()
    }

    request.authSession = session
  })
})
