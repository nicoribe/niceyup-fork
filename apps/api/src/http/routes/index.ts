import type { FastifyTypedInstance } from '@/types/fastify'
import { getAgent } from './agents/get-agent'
import { listAgents } from './agents/list-agents'
import { authRoutes } from './auth-routes'
import { getConversation } from './conversations/get-conversation'
import { listMessages } from './conversations/messages/list-messages'
import { realtimeMessages } from './conversations/messages/realtime-messages'
import { regenerateAnswerMessage } from './conversations/messages/regenerate-answer-message'
import { resendQuestionMessage } from './conversations/messages/resend-question-message'
import { sendQuestionMessage } from './conversations/messages/send-question-message'
import { streamAnswerMessage } from './conversations/messages/stream-answer-message'
import { getDatabaseConnection } from './database-connections/get-database-connection'
import { listDatabaseConnections } from './database-connections/list-database-connections'
import { getFile } from './files/get-file'
import { generateUploadSignature } from './files/internal/generate-upload-signature'
import { uploadFile } from './files/internal/upload-file'
import { health } from './health'
import { getProfile } from './profile/get-profile'
import { getSource } from './sources/get-source'
import { listSources } from './sources/list-sources'
import { getStructured } from './sources/structured/get-structured'

export async function routes(app: FastifyTypedInstance) {
  app.register(health)
  app.register(authRoutes)

  app.register(getProfile)

  app.register(listAgents)
  app.register(getAgent)
  app.register(listSources)
  app.register(getSource)
  app.register(getStructured)
  app.register(listDatabaseConnections)
  app.register(getDatabaseConnection)

  app.register(getConversation)
  app.register(listMessages)
  app.register(realtimeMessages)
  app.register(sendQuestionMessage)
  app.register(resendQuestionMessage)
  app.register(regenerateAnswerMessage)
  app.register(streamAnswerMessage)

  app.register(generateUploadSignature)
  app.register(uploadFile)
  app.register(getFile)
}
