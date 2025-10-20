import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { agents, teamMembers, teamsToAgents } from '../../schema'
import { getOrganizationIdBySlug } from '../organizations'
import { isOrganizationMemberAdmin } from './organizations'

type ContextListAgentsParams = {
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

export async function listAgents(context: ContextListAgentsParams) {
  if (!context.organizationId && !context.organizationSlug) {
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
      .where(eq(agents.ownerUserId, context.userId))

    return listAgents
  }

  if (context.teamId) {
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
          eq(teamsToAgents.teamId, context.teamId),
          eq(teamMembers.userId, context.userId),
        ),
      )

    return listAgents
  }

  const orgId =
    context.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: context.organizationSlug,
    }))

  if (!orgId) {
    return []
  }

  const isAdmin = await isOrganizationMemberAdmin({
    userId: context.userId,
    organizationId: orgId,
  })

  if (isAdmin) {
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
      .where(eq(agents.ownerOrganizationId, orgId))

    return listAgents
  }

  return []
}

type ContextGetAgentParams = {
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

type GetAgentParams = {
  agentId: string
}

export async function getAgent(
  context: ContextGetAgentParams,
  params: GetAgentParams,
) {
  if (!context.organizationId && !context.organizationSlug) {
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
      .where(
        and(
          eq(agents.id, params.agentId),
          eq(agents.ownerUserId, context.userId),
        ),
      )
      .limit(1)

    return agent || null
  }

  if (context.teamId) {
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
          eq(teamsToAgents.teamId, context.teamId),
          eq(teamMembers.userId, context.userId),
        ),
      )
      .limit(1)

    return agent || null
  }

  const orgId =
    context.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: context.organizationSlug,
    }))

  if (!orgId) {
    return null
  }

  const isAdmin = await isOrganizationMemberAdmin({
    userId: context.userId,
    organizationId: orgId,
  })

  if (isAdmin) {
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
      .where(
        and(
          eq(agents.id, params.agentId),
          eq(agents.ownerOrganizationId, orgId),
        ),
      )
      .limit(1)

    return agent || null
  }

  return null
}
