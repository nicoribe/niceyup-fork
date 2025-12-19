import { and, asc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { agents, teamMembers, teamsToAgents } from '../../schema'

type ContextListAgentsParams = {
  userId: string
  organizationId: string
  teamId?: string | null
}

export async function listAgents(context: ContextListAgentsParams) {
  const listAgents = await db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      logo: agents.logo,
      description: agents.description,
      tags: agents.tags,
    })
    .from(agents)
    .innerJoin(teamsToAgents, eq(agents.id, teamsToAgents.agentId))
    .innerJoin(teamMembers, eq(teamMembers.teamId, teamsToAgents.teamId))
    .where(
      and(
        eq(agents.organizationId, context.organizationId),
        context.teamId ? eq(teamsToAgents.teamId, context.teamId) : undefined,
        eq(teamMembers.userId, context.userId),
      ),
    )
    .orderBy(asc(agents.createdAt))

  return listAgents
}

type ContextGetAgentParams = {
  userId: string
  organizationId: string
  teamId?: string | null
}

type GetAgentParams = {
  agentId: string
}

export async function getAgent(
  context: ContextGetAgentParams,
  params: GetAgentParams,
) {
  const [agent] = await db
    .select({
      id: agents.id,
      name: agents.name,
      slug: agents.slug,
      logo: agents.logo,
      description: agents.description,
      tags: agents.tags,
    })
    .from(agents)
    .innerJoin(teamsToAgents, eq(agents.id, teamsToAgents.agentId))
    .innerJoin(teamMembers, eq(teamMembers.teamId, teamsToAgents.teamId))
    .where(
      and(
        eq(agents.id, params.agentId),
        eq(agents.organizationId, context.organizationId),
        eq(teamMembers.userId, context.userId),
        context.teamId ? eq(teamsToAgents.teamId, context.teamId) : undefined,
      ),
    )
    .limit(1)

  return agent || null
}
