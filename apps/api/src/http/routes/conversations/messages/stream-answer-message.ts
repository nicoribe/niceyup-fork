import { Readable } from 'node:stream'
import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { runs } from '@workspace/engine'
import type { STREAMS } from '@workspace/engine/trigger/answer-message'
import { z } from 'zod'

export async function streamAnswerMessage(app: FastifyTypedInstance) {
  app.register(authenticate).get(
    '/conversations/:conversationId/messages/:messageId/stream-answer',
    {
      schema: {
        tags: ['Conversations'],
        description: 'Stream answer message details',
        operationId: 'streamAnswerMessage',
        params: z.object({
          conversationId: z.string(),
          messageId: z.string(),
        }),
        querystring: z.object({
          organizationId: z.string().optional(),
          organizationSlug: z.string().optional(),
          teamId: z.string().optional(),
        }),
        response: withDefaultErrorResponses({
          200: z.unknown().describe('Success'),
        }),
      },
    },
    async (request, reply) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { conversationId, messageId } = request.params

      const { organizationId, organizationSlug, teamId } = request.query

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
          teamId,
        }),
      }

      const message = await queries.context.getMessage(context, {
        conversationId,
        messageId,
      })

      if (!message) {
        throw new BadRequestError({
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found or you don’t have access',
        })
      }

      if (message.role !== 'assistant') {
        throw new BadRequestError({
          code: 'MESSAGE_ROLE_NOT_ASSISTANT',
          message: 'Message role is not assistant',
        })
      }

      const stream = Readable.from(
        (async function* source() {
          yield `${JSON.stringify(message)}\n`

          if (
            (message.status === 'queued' || message.status === 'in_progress') &&
            message.metadata?.triggerTask?.id
          ) {
            const realtimeRunStream = runs
              .subscribeToRun(message.metadata.triggerTask.id)
              .withStreams<STREAMS>()

            for await (const part of realtimeRunStream) {
              switch (part.type) {
                case 'message-start':
                case 'message-delta':
                case 'message-end':
                  yield `${JSON.stringify({ ...message, ...part.chunk })}\n`
                  break
              }
            }
          }
        })(),
      )

      reply.header('Content-Type', 'application/x-ndjson; charset=utf-8')
      reply.header('Cache-Control', 'no-cache')
      reply.header('Connection', 'keep-alive')
      reply.header('Transfer-Encoding', 'chunked')
      reply.header('Content-Encoding', 'none')

      return reply.send(stream)
    },
  )
}
