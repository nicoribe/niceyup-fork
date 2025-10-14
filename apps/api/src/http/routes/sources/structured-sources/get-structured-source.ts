import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { authenticate } from '@/http/middlewares/authenticate'
import { getOrganizationIdentifier } from '@/lib/utils'
import type { FastifyTypedInstance } from '@/types/fastify'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

const tableMetadataSchema = z.object({
  name: z.string(),
  meta: z
    .object({
      description: z.string().optional(),
    })
    .optional(),
  columns: z.array(
    z.object({
      name: z.string(),
      meta: z
        .object({
          description: z.string().optional(),
          properNoun: z.boolean().optional(),
        })
        .optional(),
      data_type: z.string(),
      foreign_table: z.string().optional(),
      foreign_column: z.string().optional(),
    }),
  ),
})

const queryExampleSchema = z.object({
  input: z.string(),
  query: z.string(),
})

export async function getStructuredSource(app: FastifyTypedInstance) {
  app.register(authenticate).get(
    '/sources/:sourceId/structured',
    {
      schema: {
        tags: ['Sources'],
        description: 'Get structured source details',
        operationId: 'getStructuredSource',
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
              structuredSource: z.object({
                id: z.string(),
                tablesMetadata: z.array(tableMetadataSchema).nullable(),
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

      const structuredSource = await queries.context.getStructuredSource(
        context,
        {
          sourceId,
        },
      )

      if (!structuredSource) {
        throw new BadRequestError({
          code: 'STRUCTURED_SOURCE_NOT_FOUND',
          message: 'Structured source not found or you don’t have access',
        })
      }

      return { structuredSource }
    },
  )
}
