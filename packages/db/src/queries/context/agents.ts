import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { agents, teamMembers, teamsToAgents } from '../../schema'
import { isOrganizationMemberAdmin } from './organizations'

type ContextListAgentsParams = {
  userId: string
  organizationId?: string | null
  teamId?: string | null
}

export async function listAgents(context: ContextListAgentsParams) {
  const selectQuery = db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      logo: agents.logo,
      description: agents.description,
      tags: agents.tags,
    })
    .from(agents)

  if (context.organizationId) {
    if (context.teamId) {
      const listAgents = await selectQuery
        .innerJoin(teamsToAgents, eq(agents.id, teamsToAgents.agentId))
        .innerJoin(teamMembers, eq(teamMembers.teamId, teamsToAgents.teamId))
        .where(
          and(
            eq(teamsToAgents.teamId, context.teamId),
            eq(teamMembers.userId, context.userId),
          ),
        )

      return listAgents
    }

    const isAdmin = await isOrganizationMemberAdmin({
      userId: context.userId,
      organizationId: context.organizationId,
    })

    if (isAdmin) {
      const listAgents = await selectQuery.where(
        eq(agents.ownerOrganizationId, context.organizationId),
      )

      return listAgents
    }

    return []
  }

  const listAgents = await selectQuery.where(
    eq(agents.ownerUserId, context.userId),
  )

  return listAgents
}

type ContextGetAgentParams = {
  userId: string
  organizationId?: string | null
  teamId?: string | null
}

type GetAgentParams = {
  agentId: string
}

export async function getAgent(
  context: ContextGetAgentParams,
  params: GetAgentParams,
) {
  const selectQuery = db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      logo: agents.logo,
      description: agents.description,
      tags: agents.tags,
    })
    .from(agents)

  if (context.organizationId) {
    if (context.teamId) {
      const [agent] = await selectQuery
        .innerJoin(teamsToAgents, eq(agents.id, teamsToAgents.agentId))
        .innerJoin(teamMembers, eq(teamMembers.teamId, teamsToAgents.teamId))
        .where(
          and(
            eq(agents.id, params.agentId),
            eq(teamsToAgents.teamId, context.teamId),
            eq(teamMembers.userId, context.userId),
          ),
        )
        .limit(1)

      return agent || null
    }

    const isAdmin = await isOrganizationMemberAdmin({
      userId: context.userId,
      organizationId: context.organizationId,
    })

    if (isAdmin) {
      const [agent] = await selectQuery
        .where(
          and(
            eq(agents.id, params.agentId),
            eq(agents.ownerOrganizationId, context.organizationId),
          ),
        )
        .limit(1)

      return agent || null
    }

    return null
  }

  const [agent] = await selectQuery
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.ownerUserId, context.userId),
      ),
    )
    .limit(1)

  return agent || null
}
