import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { db } from '@workspace/db'
import { and, eq, isNull } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import { sourceExplorerNodes, sources } from '@workspace/db/schema'
import { z } from 'zod'

export async function createSource(app: FastifyTypedInstance) {
  app.register(authenticate).post(
    '/sources',
    {
      schema: {
        tags: ['Sources'],
        description: 'Create a new source',
        operationId: 'createSource',
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          name: z.string(),
          type: z.enum([
            'file',
            'text',
            'question-answer',
            'website',
            'database',
          ]),
          explorerNode: z
            .object({
              folderId: z.string().nullish(),
            })
            .optional(),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              sourceId: z.string(),
              explorerNode: z
                .object({
                  itemId: z.string(),
                })
                .optional(),
            })
            .describe('Success'),
        }),
      },
    },
    async (request, reply) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { organizationId, organizationSlug, name, type, explorerNode } =
        request.body

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
        }),
      }

      const orgId =
        context.organizationId ??
        (await queries.getOrganizationIdBySlug({
          organizationSlug: context.organizationSlug,
        }))

      if (explorerNode?.folderId && explorerNode.folderId !== 'root') {
        const ownerTypeCondition = orgId
          ? eq(sourceExplorerNodes.ownerOrganizationId, orgId)
          : eq(sourceExplorerNodes.ownerUserId, userId)

        const [folderExplorerNode] = await db
          .select({
            id: sourceExplorerNodes.id,
          })
          .from(sourceExplorerNodes)
          .where(
            and(
              ownerTypeCondition,
              eq(sourceExplorerNodes.id, explorerNode.folderId),
              isNull(sourceExplorerNodes.sourceId),
              isNull(sourceExplorerNodes.deletedAt),
            ),
          )
          .limit(1)

        if (!folderExplorerNode) {
          throw new BadRequestError({
            code: 'FOLDER_IN_EXPLORER_NOT_FOUND',
            message: 'Folder in explorer not found or you don’t have access',
          })
        }
      }

      let _explorerNode = null

      const { source } = await db.transaction(async (tx) => {
        const ownerTypeCondition = orgId
          ? { ownerOrganizationId: orgId }
          : { ownerUserId: userId }

        const [source] = await tx
          .insert(sources)
          .values({
            name,
            type,
            ...ownerTypeCondition,
          })
          .returning({
            id: sources.id,
          })

        if (!source) {
          throw new BadRequestError({
            code: 'SOURCE_NOT_CREATED',
            message: 'Source not created',
          })
        }

        if (explorerNode) {
          const [newItemExplorerNode] = await tx
            .insert(sourceExplorerNodes)
            .values({
              ...ownerTypeCondition,
              sourceId: source.id,
              parentId:
                explorerNode.folderId === 'root' ? null : explorerNode.folderId,
            })
            .returning({
              id: sourceExplorerNodes.id,
            })

          if (newItemExplorerNode) {
            _explorerNode = { itemId: newItemExplorerNode.id }
          }
        }

        return { source }
      })

      return reply.status(201).send({
        sourceId: source.id,
        ...(_explorerNode ? { explorerNode: _explorerNode } : {}),
      })
    },
  )
}
