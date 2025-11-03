import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { db } from '@workspace/db'
import { and, eq, isNull } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import {
  connections,
  databaseSources,
  questionAnswerSources,
  sourceExplorerNodes,
  sources,
  textSources,
} from '@workspace/db/schema'
import { runIngestionTask } from '@workspace/engine/tasks/run-ingestion'
import { z } from 'zod'

const textSourceSchema = z.object({
  type: z.literal('text'),
  name: z.string(),
  text: z.string(),
})

const questionAnswerSourceSchema = z.object({
  type: z.literal('question-answer'),
  name: z.string(),
  questions: z.array(z.string()),
  answer: z.string(),
})

const databaseSourceSchema = z.object({
  type: z.literal('database'),
  name: z.string(),
  dialect: z.enum(['postgresql', 'mysql']),
  connectionId: z.string(),
})

const sourceTypeSchema = z.intersection(
  z.object({
    type: z.enum(['text', 'question-answer', 'database']),
  }),
  z.discriminatedUnion('type', [
    textSourceSchema,
    questionAnswerSourceSchema,
    databaseSourceSchema,
  ]),
)

export async function createSource(app: FastifyTypedInstance) {
  app.register(authenticate).post(
    '/sources',
    {
      schema: {
        tags: ['Sources'],
        description: 'Create a new source',
        operationId: 'createSource',
        body: z
          .object({
            organizationId: z.string().nullish(),
            organizationSlug: z.string().nullish(),
          })
          .and(
            sourceTypeSchema.and(
              z.object({
                explorerNode: z
                  .object({
                    folderId: z.string().nullish(),
                  })
                  .optional(),
              }),
            ),
          ),
        response: withDefaultErrorResponses({
          200: z
            .object({
              sourceId: z.string(),
              explorerNode: z.object({
                itemId: z.string(),
              }),
            })
            .describe('Success'),
        }),
      },
    },
    async (request, reply) => {
      const {
        user: { id: userId },
      } = request.authSession

      const { organizationId, organizationSlug, type, name, explorerNode } =
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
        const explorerOwnerTypeCondition = orgId
          ? eq(sourceExplorerNodes.ownerOrganizationId, orgId)
          : eq(sourceExplorerNodes.ownerUserId, userId)

        const [folderExplorerNode] = await db
          .select({
            id: sourceExplorerNodes.id,
          })
          .from(sourceExplorerNodes)
          .where(
            and(
              explorerOwnerTypeCondition,
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

      const { source, newItemExplorerNode } = await db.transaction(
        async (tx) => {
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

          if (type === 'question-answer') {
            const { questions, answer } = request.body

            const [questionAnswerSource] = await tx
              .insert(questionAnswerSources)
              .values({
                questions,
                answer,
                sourceId: source.id,
              })
              .returning({
                id: questionAnswerSources.id,
              })

            if (!questionAnswerSource) {
              throw new BadRequestError({
                code: 'QUESTION_ANSWER_SOURCE_NOT_CREATED',
                message: 'Question answer source not created',
              })
            }
          } else if (type === 'database') {
            const { dialect, connectionId } = request.body

            const [connection] = await tx
              .select({
                app: connections.app,
              })
              .from(connections)
              .where(eq(connections.id, connectionId))
              .limit(1)

            if (!connection) {
              throw new BadRequestError({
                code: 'CONNECTION_NOT_FOUND',
                message: 'Connection not found',
              })
            }

            if (connection.app !== 'postgresql' && connection.app !== 'mysql') {
              throw new BadRequestError({
                code: 'INVALID_CONNECTION_APP',
                message: 'Invalid connection app',
              })
            }

            const [databaseSource] = await tx
              .insert(databaseSources)
              .values({
                dialect: dialect,
                sourceId: source.id,
                connectionId,
              })
              .returning({
                id: databaseSources.id,
              })

            if (!databaseSource) {
              throw new BadRequestError({
                code: 'DATABASE_SOURCE_NOT_CREATED',
                message: 'Database source not created',
              })
            }
          } else {
            const { text } = request.body

            const [textSource] = await tx
              .insert(textSources)
              .values({
                text,
                sourceId: source.id,
              })
              .returning({
                id: textSources.id,
              })

            if (!textSource) {
              throw new BadRequestError({
                code: 'TEXT_SOURCE_NOT_CREATED',
                message: 'Text source not created',
              })
            }
          }

          const [newItemExplorerNode] = await tx
            .insert(sourceExplorerNodes)
            .values({
              ...ownerTypeCondition,
              sourceId: source.id,
              parentId:
                explorerNode?.folderId === 'root'
                  ? null
                  : explorerNode?.folderId,
            })
            .returning({
              id: sourceExplorerNodes.id,
            })

          if (!newItemExplorerNode) {
            throw new BadRequestError({
              code: 'EXPLORER_NODE_NOT_CREATED',
              message: 'Explorer node not created',
            })
          }

          return { source, newItemExplorerNode }
        },
      )

      if (type === 'text' || type === 'question-answer') {
        await runIngestionTask.trigger({
          sourceId: source.id,
        })
      }

      return reply.status(201).send({
        sourceId: source.id,
        explorerNode: { itemId: newItemExplorerNode.id },
      })
    },
  )
}
