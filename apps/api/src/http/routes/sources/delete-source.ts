import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { db } from '@workspace/db'
import { and, eq } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import { sourceExplorerNodes, sources } from '@workspace/db/schema'
import { z } from 'zod'

export async function deleteSource(app: FastifyTypedInstance) {
  app.register(authenticate).delete(
    '/sources/:sourceId',
    {
      schema: {
        tags: ['Sources'],
        description: 'Delete a source',
        operationId: 'deleteSource',
        params: z.object({
          sourceId: z.string(),
        }),
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          destroy: z.boolean().optional(),
        }),
        response: withDefaultErrorResponses({
          204: z.null().describe('Success'),
        }),
      },
    },
    async (request, reply) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { sourceId } = request.params

      const { organizationId, organizationSlug, destroy } = request.body

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
        }),
      }

      const source = await queries.context.getSource(context, {
        sourceId,
      })

      if (!source) {
        throw new BadRequestError({
          code: 'SOURCE_NOT_FOUND',
          message: 'Source not found or you don’t have access',
        })
      }

      await db.transaction(async (tx) => {
        const explorerOwnerTypeCondition = source.ownerOrganizationId
          ? eq(
              sourceExplorerNodes.ownerOrganizationId,
              source.ownerOrganizationId,
            )
          : eq(sourceExplorerNodes.ownerUserId, source.ownerUserId!)

        const ownerTypeCondition = source.ownerOrganizationId
          ? eq(sources.ownerOrganizationId, source.ownerOrganizationId)
          : eq(sources.ownerUserId, source.ownerUserId!)

        if (destroy) {
          await tx
            .delete(sourceExplorerNodes)
            .where(
              and(
                eq(sourceExplorerNodes.sourceId, sourceId),
                explorerOwnerTypeCondition,
              ),
            )

          await tx
            .delete(sources)
            .where(and(eq(sources.id, sourceId), ownerTypeCondition))
        } else {
          await tx
            .update(sourceExplorerNodes)
            .set({ deletedAt: new Date() })
            .where(
              and(
                eq(sourceExplorerNodes.sourceId, sourceId),
                explorerOwnerTypeCondition,
              ),
            )

          await tx
            .update(sources)
            .set({ deletedAt: new Date() })
            .where(and(eq(sources.id, sourceId), ownerTypeCondition))
        }
      })

      return reply.status(204).send()
    },
  )
}
