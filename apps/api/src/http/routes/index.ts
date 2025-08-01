import type { FastifyTypedInstance } from '@/types/fastify'
import { authRoutes } from './auth'
import { health } from './health'
import { getProfile } from './profile/get-profile'

export async function routes(app: FastifyTypedInstance) {
  app.register(authRoutes)
  app.register(health)
  app.register(getProfile)
}
