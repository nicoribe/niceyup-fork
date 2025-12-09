import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { getOrganizationContext } from '@/http/functions/organization-context'
import { generateSignatureForUpload } from '@/http/functions/upload-file-to-storage'
import { authenticate } from '@/http/middlewares/authenticate'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

export async function generateUploadSignatureConversation(
  app: FastifyTypedInstance,
) {
  app.register(authenticate).post(
    '/conversations/files/signature',
    {
      schema: {
        tags: ['Conversations'],
        description: 'Generate upload signature for conversation',
        operationId: 'generateUploadSignatureConversation',
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          teamId: z.string().nullish(),
          agentId: z.string(),
          conversationId: z.string().nullish(),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              signature: z.string(),
            })
            .describe('Success'),
        }),
      },
    },
    async (request) => {
      const {
        user: { id: userId },
      } = request.authSession

      const {
        organizationId,
        organizationSlug,
        teamId,
        agentId,
        conversationId,
      } = request.body

      const context = await getOrganizationContext({
        userId,
        organizationId,
        organizationSlug,
        teamId,
      })

      if (conversationId) {
        const conversation = await queries.context.getConversation(context, {
          agentId,
          conversationId,
        })

        if (!conversation) {
          throw new BadRequestError({
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found or you don’t have access',
          })
        }
      } else {
        const agent = await queries.context.getAgent(context, {
          agentId,
        })

        if (!agent) {
          throw new BadRequestError({
            code: 'AGENT_NOT_FOUND',
            message: 'Agent not found or you don’t have access',
          })
        }
      }

      const signature = generateSignatureForUpload({
        key: 'conversations',
        payload: {
          data: {
            bucket: 'default',
            scope: 'conversations',
            metadata: {
              authorId: context.userId,
              // agentIds: [agentId],
              // ...(conversationId ? { conversationIds: [conversationId] } : {}),
            },
            owner: context.organizationId
              ? { organizationId: context.organizationId }
              : { userId: context.userId },
          },
        },
        expires: 15 * 60, // 15 minutes
      })

      return { signature }
    },
  )
}
