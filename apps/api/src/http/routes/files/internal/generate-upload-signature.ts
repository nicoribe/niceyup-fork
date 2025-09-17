import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { UnauthorizedError } from '@/http/errors/unauthorized-error'
import {
  generateSignatureForUpload,
  validateFileDataForUpload,
} from '@/http/functions/upload-file-to-storage'
import { authenticate } from '@/http/middlewares/authenticate'
import { env } from '@/lib/env'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { z } from 'zod'

const DEFAULT_ACCEPT = '*'
const DEFAULT_EXPIRES = 5 * 60 // 5 minutes

export async function generateUploadSignature(app: FastifyTypedInstance) {
  app.register(authenticate).post(
    '/files/signature',
    {
      schema: {
        tags: ['[Internal] Files'],
        description: 'Generate Upload Signature',
        operationId: 'generateUploadSignature',
        headers: z.object({
          'x-api-key': z.string(),
        }),
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          teamId: z.string().nullish(),
          bucket: z.enum(['default', 'engine']).default('default'),
          scope: z.enum(['public', 'conversations', 'sources']),
          metadata: z
            .object({
              conversationId: z.string().nullish(),
              sourceId: z.string().optional(),
            })
            .optional(),
          accept: z.string().default(DEFAULT_ACCEPT),
          expires: z.number().positive().default(DEFAULT_EXPIRES),
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
      const { 'x-api-key': apiKey } = request.headers

      if (apiKey !== env.API_KEY) {
        throw new UnauthorizedError({
          code: 'INVALID_API_KEY',
          message: 'Invalid API key',
        })
      }

      const {
        user: { id: userId },
      } = request.authSession

      const {
        organizationId,
        organizationSlug,
        teamId,
        bucket,
        scope,
        metadata,
        accept,
        expires,
      } = request.body

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
          teamId,
        }),
      }

      const fileData = await validateFileDataForUpload(context, {
        bucket,
        scope,
        metadata,
      })

      const signature = generateSignatureForUpload({
        payload: { data: fileData, accept },
        expires,
      })

      return { signature }
    },
  )
}
