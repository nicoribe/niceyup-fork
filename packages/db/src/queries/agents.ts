import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { agents, teamMembers, teamsToAgents } from '../schema'
import {
  getOrganizationIdBySlug,
  isOrganizationMemberAdmin,
} from './organizations'

type ListAgentsParams = {
  userId: string
} & (
  | {
      organizationId?: string | null
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug?: string | null
    }
) & {
    teamId?: string | null
  }

export async function listAgents({
  userId,
  organizationId,
  organizationSlug,
  teamId,
}: ListAgentsParams) {
  if (!organizationId && !organizationSlug) {
    const listAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
      })
      .from(agents)
      .where(eq(agents.userId, userId))

    return listAgents
  }

  if (teamId) {
    const listAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
      })
      .from(agents)
      .innerJoin(teamsToAgents, eq(agents.id, teamsToAgents.agentId))
      .innerJoin(teamMembers, eq(teamMembers.teamId, teamsToAgents.teamId))
      .where(
        and(eq(teamsToAgents.teamId, teamId), eq(teamMembers.userId, userId)),
      )

    return listAgents
  }

  const orgId =
    organizationId ?? (await getOrganizationIdBySlug({ organizationSlug }))

  if (!orgId) {
    console.log('listAgents', 'Organization not found')
    return []
  }

  const isAdmin = await isOrganizationMemberAdmin({
    userId,
    organizationId: orgId,
  })

  if (isAdmin) {
    const listAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
      })
      .from(agents)
      .where(eq(agents.organizationId, orgId))

    return listAgents
  }

  return []
}

type GetAgentParams = {
  userId: string
} & (
  | {
      organizationId?: string | null
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug?: string | null
    }
) & {
    teamId?: string | null
    agentId: string
  }

export async function getAgent({
  userId,
  organizationId,
  organizationSlug,
  teamId,
  agentId,
}: GetAgentParams) {
  if (!organizationId && !organizationSlug) {
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
      })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.userId, userId)))
      .limit(1)

    return agent || null
  }

  if (teamId) {
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
      })
      .from(agents)
      .innerJoin(teamsToAgents, eq(agents.id, teamsToAgents.agentId))
      .innerJoin(teamMembers, eq(teamMembers.teamId, teamsToAgents.teamId))
      .where(
        and(
          eq(agents.id, agentId),
          eq(teamsToAgents.teamId, teamId),
          eq(teamMembers.userId, userId),
        ),
      )
      .limit(1)

    return agent || null
  }

  const orgId =
    organizationId ?? (await getOrganizationIdBySlug({ organizationSlug }))

  if (!orgId) {
    console.log('getAgent', 'Organization not found')
    return null
  }

  const isAdmin = await isOrganizationMemberAdmin({
    userId,
    organizationId: orgId,
  })

  if (isAdmin) {
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
      })
      .from(agents)
      .where(and(eq(agents.id, agentId), eq(agents.organizationId, orgId)))
      .limit(1)

    return agent || null
  }

  return null
}
