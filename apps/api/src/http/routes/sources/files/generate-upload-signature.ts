import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { generateSignatureForUpload } from '@/http/functions/upload-file-to-storage'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

export async function generateUploadSignatureSource(app: FastifyTypedInstance) {
  app.register(authenticate).post(
    '/sources/files/signature',
    {
      schema: {
        tags: ['Sources'],
        description: 'Generate upload signature for source',
        operationId: 'generateUploadSignatureSource',
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          sourceType: z.enum(['file', 'database']).default('file'),
          explorerNode: z
            .object({
              folderId: z.string().nullish(),
            })
            .optional(),
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

      const { organizationId, organizationSlug, sourceType, explorerNode } =
        request.body

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
        }),
      }

      const orgId =
        context.organizationId || context.organizationSlug
          ? context.organizationId ||
            (await queries.getOrganizationIdBySlug({
              organizationSlug: context.organizationSlug,
            }))
          : null

      const signature = generateSignatureForUpload({
        key: 'sources',
        payload: {
          data: {
            bucket: 'engine',
            scope: 'sources',
            metadata: {
              authorId: context.userId,
            },
            owner: orgId
              ? { organizationId: orgId }
              : { userId: context.userId },
          },
          sourceType,
          explorerNode,
        },
        expires: 15 * 60, // 15 minutes
      })

      return { signature }
    },
  )
}
