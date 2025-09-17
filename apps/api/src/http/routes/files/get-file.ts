import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { env } from '@/lib/env'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { GetObjectCommand, getSignedUrl, s3Client } from '@workspace/storage'
import { z } from 'zod'

const DEFAULT_EXPIRES = 5 * 60 // 5 minutes

export async function getFile(app: FastifyTypedInstance) {
  app.get(
    '/files/:fileId',
    {
      schema: {
        tags: ['Files'],
        description: 'Get a file',
        operationId: 'getFile',
        params: z.object({
          fileId: z.string(),
        }),
        querystring: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          teamId: z.string().nullish(),
          expires: z.number().optional().default(DEFAULT_EXPIRES),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              file: z.object({
                id: z.string(),
                fileName: z.string(),
                fileMimeType: z.string(),
                fileUri: z.string(),
                bucket: z.enum(['default', 'engine']),
                scope: z.enum(['public', 'conversations', 'sources']),
                url: z.string(),
              }),
            })
            .describe('Success'),
        }),
      },
    },
    async (request) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { fileId } = request.params

      const { organizationId, organizationSlug, teamId, expires } =
        request.query

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
          teamId,
        }),
      }

      const file = await queries.context.getFile(context, {
        fileId,
      })

      if (!file) {
        throw new BadRequestError({
          code: 'FILE_NOT_FOUND',
          message: 'File not found or you don’t have access',
        })
      }

      let url = new URL(file.fileUri, env.STORAGE_URL).toString()

      if (file.bucket === 'engine') {
        const command = new GetObjectCommand({
          Bucket: env.S3_ENGINE_BUCKET,
          Key: file.fileUri,
        })

        url = await getSignedUrl(s3Client, command, { expiresIn: expires })
      }

      return { file: { ...file, url } }
    },
  )
}
