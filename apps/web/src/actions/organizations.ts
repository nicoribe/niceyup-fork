'use server'

import { authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'
import { auth } from '@workspace/auth'
import { db } from '@workspace/db'
import { and, eq } from '@workspace/db/orm'
import { members, organizations, teams } from '@workspace/db/schema'
import { headers as headersNext } from 'next/headers'

export async function getOrganizationSlugById(organizationId: string) {
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

export async function getOrganization(
  organizationSlug: OrganizationTeamParams['organizationSlug'],
) {
  const { user } = await authenticatedUser()

  if (organizationSlug === 'my-account') {
    return null
  }

  const [organization] = await db
    .select({
      id: organizations.id,
    })
    .from(organizations)
    .innerJoin(members, eq(organizations.id, members.organizationId))
    .where(
      and(
        eq(organizations.slug, organizationSlug),
        eq(members.userId, user.id),
      ),
    )
    .limit(1)

  return organization || null
}

export async function getOrganizationTeam(
  organizationSlug: OrganizationTeamParams['organizationSlug'],
  teamId: OrganizationTeamParams['teamId'],
) {
  const { user } = await authenticatedUser()

  if (organizationSlug === 'my-account' || teamId === '~') {
    return null
  }

  const [organizationTeam] = await db
    .select({
      organization: {
        id: organizations.id,
      },
      team: {
        id: teams.id,
      },
    })
    .from(teams)
    .innerJoin(organizations, eq(teams.organizationId, organizations.id))
    .innerJoin(members, eq(organizations.id, members.organizationId))
    .where(
      and(
        eq(teams.id, teamId),
        eq(organizations.slug, organizationSlug),
        eq(members.userId, user.id),
      ),
    )
    .limit(1)

  return organizationTeam || null
}

export async function updateActiveOrganizationTeam(
  organizationId?: string | null,
  teamId?: string | null,
) {
  const headers = await headersNext()

  await auth.api.setActiveOrganization({
    body: { organizationId: organizationId || null },
    headers,
  })
  await auth.api.setActiveTeam({
    body: { teamId: teamId || null },
    headers,
  })
}
