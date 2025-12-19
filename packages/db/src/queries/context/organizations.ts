import { and, asc, eq, isNotNull } from 'drizzle-orm'
import { db } from '../../db'
import {
  members,
  organizations,
  teamMembers,
  teams,
  users,
} from '../../schema/auth'
import { getOrganizationIdBySlug } from '../organizations'

type ContextGetOrganizationParams = {
  userId: string
}

type GetOrganizationParams =
  | {
      organizationId: string
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug: string
    }

export async function getOrganization(
  context: ContextGetOrganizationParams,
  params: GetOrganizationParams,
) {
  const [organization] = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      name: organizations.name,
      logo: organizations.logo,
      metadata: organizations.metadata,
    })
    .from(organizations)
    .innerJoin(members, eq(organizations.id, members.organizationId))
    .where(
      and(
        params.organizationId !== undefined
          ? eq(organizations.id, params.organizationId)
          : eq(organizations.slug, params.organizationSlug),
        eq(members.userId, context.userId),
      ),
    )
    .limit(1)

  return organization || null
}

type ContextListOrganizationsParams = {
  userId: string
}

export async function listOrganizations(
  context: ContextListOrganizationsParams,
) {
  const listOrganizations = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
      name: organizations.name,
      logo: organizations.logo,
      metadata: organizations.metadata,
    })
    .from(organizations)
    .innerJoin(members, eq(organizations.id, members.organizationId))
    .where(eq(members.userId, context.userId))
    .orderBy(asc(organizations.createdAt))

  return listOrganizations
}

type ContextGetOrganizationTeamParams = {
  userId: string
}

type GetOrganizationTeamParams = (
  | {
      organizationId: string
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug: string
    }
) & {
  teamId: string
}

export async function getOrganizationTeam(
  context: ContextGetOrganizationTeamParams,
  params: GetOrganizationTeamParams,
) {
  const orgId =
    params.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: params.organizationSlug,
    }))

  if (!orgId) {
    return null
  }

  const [organizationTeam] = await db
    .select({
      organization: {
        id: organizations.id,
        slug: organizations.slug,
        name: organizations.name,
        logo: organizations.logo,
        metadata: organizations.metadata,
      },
      team: {
        id: teams.id,
        name: teams.name,
      },
    })
    .from(teams)
    .innerJoin(organizations, eq(teams.organizationId, organizations.id))
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(
      and(eq(teams.id, params.teamId), eq(teamMembers.userId, context.userId)),
    )
    .limit(1)

  return organizationTeam || null
}

type ContextListOrganizationTeamsParams = {
  userId: string
}

type ListOrganizationTeamsParams =
  | {
      organizationId: string
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug: string
    }

export async function listOrganizationTeams(
  context: ContextListOrganizationTeamsParams,
  params: ListOrganizationTeamsParams,
) {
  const orgId =
    params.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: params.organizationSlug,
    }))

  if (!orgId) {
    return []
  }

  const listOrganizationTeams = await db
    .select({
      organization: {
        id: organizations.id,
        slug: organizations.slug,
        name: organizations.name,
        logo: organizations.logo,
        metadata: organizations.metadata,
      },
      team: {
        id: teams.id,
        name: teams.name,
        organizationId: teams.organizationId,
      },
    })
    .from(teams)
    .innerJoin(organizations, eq(teams.organizationId, organizations.id))
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(
      and(
        eq(teams.organizationId, orgId),
        eq(teamMembers.userId, context.userId),
      ),
    )
    .orderBy(asc(teams.createdAt))

  return listOrganizationTeams
}

type ContextGetMembershipParams = {
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

export async function getMembership(context: ContextGetMembershipParams) {
  const orgId =
    context.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: context.organizationSlug,
    }))

  if (!orgId) {
    return null
  }

  const [membership] = await db
    .select({
      id: members.id,
      role: members.role,
      userId: members.userId,
      organizationId: members.organizationId,
    })
    .from(members)
    .where(
      and(
        eq(members.userId, context.userId),
        eq(members.organizationId, orgId),
      ),
    )
    .limit(1)

  if (!membership) {
    return null
  }

  return {
    ...membership,
    isAdmin:
      membership.role === 'owner' ||
      membership.role === 'admin' ||
      membership.role === 'billing',
  }
}

type ContextIsOrganizationMemberAdminParams = {
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

export async function isOrganizationMemberAdmin(
  context: ContextIsOrganizationMemberAdminParams,
) {
  const orgId =
    context.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: context.organizationSlug,
    }))

  if (!orgId) {
    return false
  }

  const [member] = await db
    .select({
      role: members.role,
    })
    .from(members)
    .where(
      and(
        eq(members.userId, context.userId),
        eq(members.organizationId, orgId),
      ),
    )
    .limit(1)

  return (
    member?.role === 'owner' ||
    member?.role === 'admin' ||
    member?.role === 'billing'
  )
}

type ContextGetFirstOrganizationParams = {
  userId: string
}

export async function getFirstOrganization(
  context: ContextGetFirstOrganizationParams,
) {
  const [organization] = await db
    .select({
      id: organizations.id,
      slug: organizations.slug,
    })
    .from(organizations)
    .innerJoin(members, eq(organizations.id, members.organizationId))
    .where(
      and(eq(members.userId, context.userId), isNotNull(organizations.slug)),
    )
    .orderBy(asc(organizations.createdAt))
    .limit(1)

  return organization || null
}

type ContextListOrganizationMembersParams = {
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

export async function listOrganizationMembers(
  context: ContextListOrganizationMembersParams,
) {
  const checkAccessToOrganization = await getOrganization(context, context)

  if (!checkAccessToOrganization) {
    return []
  }

  const listOrganizationMembers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      role: members.role,
      memberId: members.id,
    })
    .from(members)
    .innerJoin(users, eq(members.userId, users.id))
    .where(eq(members.organizationId, checkAccessToOrganization.id))
    .orderBy(asc(members.createdAt))

  return listOrganizationMembers
}
