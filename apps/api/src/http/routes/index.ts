import type { FastifyTypedInstance } from '@/types/fastify'
import { getAgent } from './agents/get-agent'
import { listAgents } from './agents/list-agents'
import { authRoutes } from './auth-routes'
import { getConversation } from './conversations/get-conversation'
import { health } from './health'
import { getProfile } from './profile/get-profile'

export async function routes(app: FastifyTypedInstance) {
  app.register(health)
  app.register(authRoutes)

  app.register(getProfile)

  app.register(listAgents)
  app.register(getAgent)

  app.register(getConversation)
}
