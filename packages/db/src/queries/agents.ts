import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { agents, teamsToAgents } from '../schema'
import { isOrganizationMemberAdmin } from './organizations'

export async function listAgents({
  userId,
  organizationId,
  teamId,
}: {
  userId: string
  organizationId?: string | null
  teamId?: string | null
}) {
  if (!organizationId) {
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
      .where(and(eq(teamsToAgents.teamId, teamId)))

    return listAgents
  }

  const isAdmin = await isOrganizationMemberAdmin({
    userId,
    organizationId,
  })

  if (isAdmin) {
    const listAgents = await db
      .select({
        id: agents.id,
        name: agents.name,
      })
      .from(agents)
      .where(eq(agents.organizationId, organizationId))

    return listAgents
  }

  return []
}

export async function getAgent(
  {
    userId,
    organizationId,
    teamId,
  }: {
    userId: string
    organizationId?: string | null
    teamId?: string | null
  },
  { agentId }: { agentId: string },
) {
  if (!organizationId) {
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
      .where(and(eq(agents.id, agentId), eq(teamsToAgents.teamId, teamId)))
      .limit(1)

    return agent || null
  }

  const isAdmin = await isOrganizationMemberAdmin({
    userId,
    organizationId,
  })

  if (isAdmin) {
    const [agent] = await db
      .select({
        id: agents.id,
        name: agents.name,
      })
      .from(agents)
      .where(
        and(eq(agents.id, agentId), eq(agents.organizationId, organizationId)),
      )
      .limit(1)

    return agent || null
  }

  return null
}
