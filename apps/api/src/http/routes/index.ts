import type { FastifyTypedInstance } from '@/types/fastify'
import { getAgent } from './agents/get-agent'
import { listAgents } from './agents/list-agents'
import { authRoutes } from './auth-routes'
import { createConnection } from './connections/create-connection'
import { deleteConnection } from './connections/delete-connection'
import { getConnection } from './connections/get-connection'
import { listConnections } from './connections/list-connections'
import { updateConnection } from './connections/update-connection'
import { deleteConversation } from './conversations/delete-conversation'
import { generateUploadSignatureConversation } from './conversations/files/generate-upload-signature'
import { uploadFilesConversation } from './conversations/files/upload-files'
import { getConversation } from './conversations/get-conversation'
import { listConversations } from './conversations/list-conversations'
import { listMessages } from './conversations/messages/list-messages'
import { realtimeMessages } from './conversations/messages/realtime-messages'
import { regenerateAnswerMessage } from './conversations/messages/regenerate-answer-message'
import { resendQuestionMessage } from './conversations/messages/resend-question-message'
import { sendQuestionMessage } from './conversations/messages/send-question-message'
import { streamAnswerMessage } from './conversations/messages/stream-answer-message'
import { updateConversation } from './conversations/update-conversation'
import { generateUploadSignature } from './files/generate-upload-signature'
import { getFile } from './files/get-file'
import { uploadFiles } from './files/upload-files'
import { health } from './health'
import { getProfile } from './profile/get-profile'
import { createSource } from './sources/create-source'
import { deleteSource } from './sources/delete-source'
import { generateUploadSignatureSource } from './sources/files/generate-upload-signature'
import { uploadFilesSource } from './sources/files/upload-files'
import { getSource } from './sources/get-source'
import { listSources } from './sources/list-sources'
import { updateSource } from './sources/update-source'

export async function routes(app: FastifyTypedInstance) {
  app.register(health)
  app.register(authRoutes)

  app.register(getProfile)

  app.register(listAgents)
  app.register(getAgent)

  app.register(listConnections)
  app.register(getConnection)
  app.register(createConnection)
  app.register(updateConnection)
  app.register(deleteConnection)

  app.register(listSources)
  app.register(getSource)
  app.register(createSource)
  app.register(updateSource)
  app.register(deleteSource)

  app.register(listConversations)
  app.register(getConversation)
  app.register(updateConversation)
  app.register(deleteConversation)
  app.register(listMessages)
  app.register(realtimeMessages)
  app.register(sendQuestionMessage)
  app.register(resendQuestionMessage)
  app.register(regenerateAnswerMessage)
  app.register(streamAnswerMessage)

  app.register(getFile)
  app.register(generateUploadSignature)
  app.register(uploadFiles)
  app.register(generateUploadSignatureSource)
  app.register(uploadFilesSource)
  app.register(generateUploadSignatureConversation)
  app.register(uploadFilesConversation)
}
