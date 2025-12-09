import { and, eq, inArray } from '@workspace/db/orm'
import { queries } from '@workspace/db/queries'
import { z } from 'zod'

import { BadRequestError } from '@/http/errors/bad-request-error'
import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import { getOrganizationContext } from '@/http/functions/organization-context'
import { authenticate } from '@/http/middlewares/authenticate'
import type { FastifyTypedInstance } from '@/types/fastify'
import { db } from '@workspace/db'
import { agentsToSources, sources } from '@workspace/db/schema'

export async function manageAgentSources(app: FastifyTypedInstance) {
  app.register(authenticate).patch(
    '/agents/:agentId/sources',
    {
      schema: {
        tags: ['Agents'],
        description:
          'Manage sources of an agent to add or remove them from the agent.',
        operationId: 'manageAgentSources',
        params: z.object({
          agentId: z.string(),
        }),
        body: z.object({
          organizationId: z.string().nullish(),
          organizationSlug: z.string().nullish(),
          teamId: z.string().nullish(),
          add: z.array(z.string()),
          remove: z.array(z.string()),
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

      const { agentId } = request.params

      const { organizationId, organizationSlug, teamId, add, remove } =
        request.body

      const context = await getOrganizationContext({
        userId,
        organizationId,
        organizationSlug,
        teamId,
      })

      const agent = await queries.context.getAgent(context, { agentId })

      if (!agent) {
        throw new BadRequestError({
          code: 'AGENT_NOT_FOUND',
          message: 'Agent not found or you don’t have access',
        })
      }

      const sourceOwnerTypeCondition = context.organizationId
        ? eq(sources.ownerOrganizationId, context.organizationId)
        : eq(sources.ownerUserId, context.userId)

      const [sourcesAdd, sourcesRemove] = await Promise.all([
        db
          .select({ id: sources.id })
          .from(sources)
          .where(and(inArray(sources.id, add), sourceOwnerTypeCondition)),
        db
          .select({ id: sources.id })
          .from(sources)
          .where(and(inArray(sources.id, remove), sourceOwnerTypeCondition)),
      ])

      const sourceAddIdsNotFound = add.filter(
        (id) => !sourcesAdd.some((source) => source.id === id),
      )
      const sourceRemoveIdsNotFound = remove.filter(
        (id) => !sourcesRemove.some((source) => source.id === id),
      )

      if (sourceAddIdsNotFound.length || sourceRemoveIdsNotFound.length) {
        const sourceIdsNotFound = [
          ...sourceAddIdsNotFound,
          ...sourceRemoveIdsNotFound,
        ]

        const plural = sourceIdsNotFound.length > 1

        throw new BadRequestError({
          code: 'SOURCE_NOT_FOUND',
          message: `${plural ? 'Sources' : 'Source'} with ${plural ? 'IDs' : 'ID'} ${sourceIdsNotFound.join(', ')} not found or you don’t have access`,
        })
      }

      await db.transaction(async (tx) => {
        if (add.length) {
          await tx
            .insert(agentsToSources)
            .values(
              sourcesAdd.map((source) => ({
                agentId,
                sourceId: source.id,
              })),
            )
            .onConflictDoNothing()
        }

        if (remove.length) {
          await tx
            .delete(agentsToSources)
            .where(
              and(
                eq(agentsToSources.agentId, agentId),
                inArray(agentsToSources.sourceId, remove),
              ),
            )
        }
      })

      return reply.status(204).send()
    },
  )
}
