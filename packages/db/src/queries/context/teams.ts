import { and, asc, eq, ilike, sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  members,
  organizations,
  teamMembers,
  teams,
  users,
} from '../../schema/auth'
import { getOrganizationIdBySlug } from '../organizations'
import { isOrganizationMemberAdmin } from './organizations'

type ContextGetTeamParams = {
  userId: string
} & (
  | {
      organizationId: string
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug: string
    }
)

type GetTeamParams = {
  teamId: string
}

export async function getTeam(
  context: ContextGetTeamParams,
  params: GetTeamParams,
) {
  const orgId =
    context.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: context.organizationSlug,
    }))

  if (!orgId) {
    return null
  }

  const selectQuery = db
    .select({
      id: teams.id,
      name: teams.name,
      organizationId: teams.organizationId,
    })
    .from(teams)

  const isAdmin = await isOrganizationMemberAdmin({
    userId: context.userId,
    organizationId: orgId,
  })

  if (isAdmin) {
    const [team] = await selectQuery
      .innerJoin(members, eq(teams.organizationId, members.organizationId))
      .where(
        and(
          eq(teams.id, params.teamId),
          eq(teams.organizationId, orgId),
          eq(members.userId, context.userId),
        ),
      )
      .limit(1)

    return team || null
  }

  const [team] = await selectQuery
    .innerJoin(organizations, eq(teams.organizationId, organizations.id))
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(
      and(
        eq(teams.id, params.teamId),
        eq(teams.organizationId, orgId),
        eq(teamMembers.userId, context.userId),
      ),
    )
    .limit(1)

  return team || null
}

type ContextListTeamsParams = {
  userId: string
} & (
  | {
      organizationId: string
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug: string
    }
)

type ListTeamsParams = {
  search?: string
}

export async function listTeams(
  context: ContextListTeamsParams,
  params?: ListTeamsParams,
) {
  const orgId =
    context.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: context.organizationSlug,
    }))

  if (!orgId) {
    return []
  }

  const selectQuery = db
    .select({
      id: teams.id,
      name: teams.name,
      organizationId: teams.organizationId,
      memberCount:
        sql<number>`(SELECT COUNT(*) FROM ${teamMembers} WHERE ${teamMembers.teamId} = ${teams.id})`.as(
          'memberCount',
        ),
    })
    .from(teams)

  const isAdmin = await isOrganizationMemberAdmin({
    userId: context.userId,
    organizationId: orgId,
  })

  if (isAdmin) {
    const listTeams = await selectQuery
      .innerJoin(members, eq(teams.organizationId, members.organizationId))
      .where(
        and(
          eq(teams.organizationId, orgId),
          eq(members.userId, context.userId),
          params?.search ? ilike(teams.name, `%${params.search}%`) : undefined,
        ),
      )
      .orderBy(asc(teams.createdAt))

    return listTeams
  }

  const listTeams = await selectQuery
    .innerJoin(organizations, eq(teams.organizationId, organizations.id))
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(
      and(
        eq(teams.organizationId, orgId),
        eq(teamMembers.userId, context.userId),
        params?.search ? ilike(teams.name, `%${params.search}%`) : undefined,
      ),
    )
    .orderBy(asc(teams.createdAt))

  return listTeams
}

type ContextListTeamMembersParams = {
  userId: string
} & (
  | {
      organizationId: string
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug: string
    }
)

type ListTeamMembersParams = {
  teamId: string
}

export async function listTeamMembers(
  context: ContextListTeamMembersParams,
  params: ListTeamMembersParams,
) {
  const orgId =
    context.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: context.organizationSlug,
    }))

  if (!orgId) {
    return []
  }

  const listTeamMembers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: members.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .innerJoin(members, eq(users.id, members.userId))
    .where(
      and(
        eq(teamMembers.teamId, params.teamId),
        eq(teams.organizationId, orgId),
        eq(members.organizationId, orgId),
      ),
    )
    .orderBy(asc(teamMembers.createdAt))

  return listTeamMembers
}
