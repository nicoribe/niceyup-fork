import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { members, organizations, teamMembers, teams } from '../schema/auth'

export async function getOrganizationSlugById({
  organizationId,
}: {
  organizationId: string | null | undefined
}) {
  if (!organizationId) {
    return null
  }

  const [organization] = await db
    .select({
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  return organization?.slug || null
}

export async function getOrganizationIdBySlug({
  organizationSlug,
}: {
  organizationSlug: string | null | undefined
}) {
  if (!organizationSlug) {
    return null
  }

  const [organization] = await db
    .select({
      id: organizations.id,
    })
    .from(organizations)
    .where(eq(organizations.slug, organizationSlug))
    .limit(1)

  return organization?.id || null
}

type GetOrganizationParams = {
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

export async function getOrganization({
  userId,
  organizationId,
  organizationSlug,
}: GetOrganizationParams) {
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
        organizationId !== undefined
          ? eq(organizations.id, organizationId)
          : eq(organizations.slug, organizationSlug),
        eq(members.userId, userId),
      ),
    )
    .limit(1)

  return organization || null
}

type GetOrganizationTeamParams = {
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
) & {
    teamId: string
  }

export async function getOrganizationTeam({
  userId,
  organizationId,
  organizationSlug,
  teamId,
}: GetOrganizationTeamParams) {
  const orgId =
    organizationId ?? (await getOrganizationIdBySlug({ organizationSlug }))

  if (!orgId) {
    console.log('getOrganizationTeam', 'Organization not found')
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
        organizationId: teams.organizationId,
      },
    })
    .from(teams)
    .innerJoin(organizations, eq(teams.organizationId, organizations.id))
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(and(eq(teams.id, teamId), eq(teamMembers.userId, userId)))
    .limit(1)

  return organizationTeam || null
}

type GetMembershipParams = {
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

export async function getMembership({
  userId,
  organizationId,
  organizationSlug,
}: GetMembershipParams) {
  const orgId =
    organizationId ?? (await getOrganizationIdBySlug({ organizationSlug }))

  if (!orgId) {
    console.log('getMembership', 'Organization not found')
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
    .where(and(eq(members.userId, userId), eq(members.organizationId, orgId)))
    .limit(1)

  if (!membership) {
    console.log('getMembership', 'Membership not found')
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

type IsOrganizationMemberAdminParams = {
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

export async function isOrganizationMemberAdmin({
  userId,
  organizationId,
  organizationSlug,
}: IsOrganizationMemberAdminParams) {
  const orgId =
    organizationId ?? (await getOrganizationIdBySlug({ organizationSlug }))

  if (!orgId) {
    console.log('isOrganizationMemberAdmin', 'Organization not found')
    return false
  }

  const [member] = await db
    .select({
      role: members.role,
    })
    .from(members)
    .where(and(eq(members.userId, userId), eq(members.organizationId, orgId)))
    .limit(1)

  return (
    member?.role === 'owner' ||
    member?.role === 'admin' ||
    member?.role === 'billing'
  )
}
