import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

const tableMetadataSchema = z.object({
  name: z.string(),
  columns: z.array(
    z.object({
      name: z.string(),
      data_type: z.string(),
      foreign_table: z.string().optional(),
      foreign_column: z.string().optional(),
    }),
  ),
})

const tableInfoSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  columns: z.array(
    z.object({
      name: z.string(),
      description: z.string().optional(),
      data_type: z.string(),
      foreign_table: z.string().optional(),
      foreign_column: z.string().optional(),
    }),
  ),
})

const tableColumnProperNounsSchema = z.object({
  name: z.string(),
  columns: z.array(
    z.object({
      name: z.string(),
    }),
  ),
})

const queryExampleSchema = z.object({
  input: z.string(),
  query: z.string(),
})

export async function getStructured(app: FastifyTypedInstance) {
  app.register(authenticate).get(
    '/sources/:sourceId/structured',
    {
      schema: {
        tags: ['Sources'],
        description: 'Get structured details',
        operationId: 'getStructured',
        params: z.object({
          sourceId: z.string(),
        }),
        querystring: z.object({
          organizationId: z.string().optional(),
          organizationSlug: z.string().optional(),
        }),
        response: withDefaultErrorResponses({
          200: z
            .object({
              structured: z.object({
                id: z.string(),
                tablesMetadata: z.array(tableMetadataSchema).nullable(),
                tablesInfo: z.array(tableInfoSchema).nullable(),
                tablesColumnProperNouns: z
                  .array(tableColumnProperNounsSchema)
                  .nullable(),
                queryExamples: z.array(queryExampleSchema).nullable(),
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

      const { sourceId } = request.params

      const { organizationId, organizationSlug } = request.query

      const context = {
        userId,
        ...getOrganizationIdentifier({
          organizationId,
          organizationSlug,
        }),
      }

      const structured = await queries.context.getStructured(context, {
        sourceId,
      })

      if (!structured) {
        throw new BadRequestError({
          code: 'STRUCTURED_NOT_FOUND',
          message: 'Structured not found or you don’t have access',
        })
      }

      return { structured }
    },
  )
}
