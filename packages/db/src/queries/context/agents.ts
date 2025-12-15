import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { agents, teamMembers, teamsToAgents } from '../../schema'

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
    const listAgents = await selectQuery
      .innerJoin(teamsToAgents, eq(agents.id, teamsToAgents.agentId))
      .innerJoin(teamMembers, eq(teamMembers.teamId, teamsToAgents.teamId))
      .where(
        and(
          eq(agents.ownerOrganizationId, context.organizationId),
          context.teamId ? eq(teamsToAgents.teamId, context.teamId) : undefined,
          eq(teamMembers.userId, context.userId),
        ),
      )

    return listAgents
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
    const [agent] = await selectQuery
      .innerJoin(teamsToAgents, eq(agents.id, teamsToAgents.agentId))
      .innerJoin(teamMembers, eq(teamMembers.teamId, teamsToAgents.teamId))
      .where(
        and(
          eq(agents.id, params.agentId),
          eq(agents.ownerOrganizationId, context.organizationId),
          context.teamId ? eq(teamsToAgents.teamId, context.teamId) : undefined,
          eq(teamMembers.userId, context.userId),
        ),
      )
      .limit(1)

    return agent || null
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
