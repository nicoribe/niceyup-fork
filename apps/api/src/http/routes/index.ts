import type { FastifyTypedInstance } from '@/types/fastify'
import { authRoutes } from './auth'
import { healthRoutes } from './health'

export async function routes(app: FastifyTypedInstance) {
  app.register(healthRoutes)
  app.register(authRoutes)
}
