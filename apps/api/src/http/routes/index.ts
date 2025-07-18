import type { FastifyTypedInstance } from '@/types/fastify'
import { authRoutes } from './auth'
import { healthRoutes } from './health'
import { helloWorldRoutes } from './hello-world'

export async function routes(app: FastifyTypedInstance) {
  app.register(healthRoutes)
  app.register(authRoutes)
  app.register(helloWorldRoutes)
}
