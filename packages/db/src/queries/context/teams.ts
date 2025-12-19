import { and, asc, eq, sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  members,
  organizations,
  teamMembers,
  teams,
  users,
} from '../../schema/auth'

type ContextGetTeamParams = {
  userId: string
  organizationId: string
  isAdmin: boolean
}

type GetTeamParams = {
  teamId: string
}

export async function getTeam(
  context: ContextGetTeamParams,
  params: GetTeamParams,
) {
  const selectQuery = db
    .select({
      id: teams.id,
      name: teams.name,
      organizationId: teams.organizationId,
    })
    .from(teams)

  if (context.isAdmin) {
    const [team] = await selectQuery
      .innerJoin(members, eq(teams.organizationId, members.organizationId))
      .where(
        and(
          eq(teams.id, params.teamId),
          eq(teams.organizationId, context.organizationId),
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
        eq(teams.organizationId, context.organizationId),
        eq(teamMembers.userId, context.userId),
      ),
    )
    .limit(1)

  return team || null
}

type ContextListTeamsParams = {
  userId: string
  organizationId: string
  isAdmin: boolean
}

export async function listTeams(context: ContextListTeamsParams) {
  const selectQuery = db
    .select({
      id: teams.id,
      name: teams.name,
      memberCount:
        sql<number>`(SELECT COUNT(*) FROM ${teamMembers} WHERE ${teamMembers.teamId} = ${teams.id})`.as(
          'memberCount',
        ),
      organizationId: teams.organizationId,
    })
    .from(teams)

  if (context.isAdmin) {
    const listTeams = await selectQuery
      .innerJoin(members, eq(teams.organizationId, members.organizationId))
      .where(
        and(
          eq(teams.organizationId, context.organizationId),
          eq(members.userId, context.userId),
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
        eq(teams.organizationId, context.organizationId),
        eq(teamMembers.userId, context.userId),
      ),
    )
    .orderBy(asc(teams.createdAt))

  return listTeams
}

type ContextListTeamMembersParams = {
  userId: string
  organizationId: string
  isAdmin: boolean
}

type ListTeamMembersParams = {
  teamId: string
}

export async function listTeamMembers(
  context: ContextListTeamMembersParams,
  params: ListTeamMembersParams,
) {
  const checkAccessToTeam = await getTeam(context, params)

  if (!checkAccessToTeam) {
    return []
  }

  const listTeamMembers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: members.role,
      teamMemberId: teamMembers.id,
      memberId: members.id,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .innerJoin(members, eq(users.id, members.userId))
    .where(
      and(
        eq(teamMembers.teamId, params.teamId),
        eq(teams.organizationId, context.organizationId),
        eq(members.organizationId, context.organizationId),
      ),
    )
    .orderBy(asc(teamMembers.createdAt))

  return listTeamMembers
}
