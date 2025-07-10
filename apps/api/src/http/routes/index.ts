import type { FastifyTypedInstance } from '@/types/fastify'
import { authRoutes } from './auth'

export async function routes(app: FastifyTypedInstance) {
  app.register(authRoutes)
}
