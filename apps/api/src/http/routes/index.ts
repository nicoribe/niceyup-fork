import type { FastifyTypedInstance } from '@/types/fastify'
import { getAgent } from './agents/get-agent'
import { listAgents } from './agents/list-agents'
import { authRoutes } from './auth-routes'
import { getConversation } from './conversations/get-conversation'
import { listMessages } from './conversations/messages/list-messages'
import { sendQuestionMessage } from './conversations/messages/send-question-message'
import { health } from './health'
import { getProfile } from './profile/get-profile'

export async function routes(app: FastifyTypedInstance) {
  app.register(health)
  app.register(authRoutes)

  app.register(getProfile)

  app.register(listAgents)
  app.register(getAgent)

  app.register(getConversation)
  app.register(listMessages)
  app.register(sendQuestionMessage)
}
