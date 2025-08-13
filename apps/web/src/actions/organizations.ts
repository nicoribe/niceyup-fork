'use server'

import type { OrganizationTeamParams } from '@/lib/types'
import { auth } from '@workspace/auth'
import { db } from '@workspace/db'
import { and, eq } from '@workspace/db/orm'
import { organizations, teams } from '@workspace/db/schema'
import { headers } from 'next/headers'

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
  if (organizationSlug === 'my-account') {
    return null
  }

  const [organization] = await db
    .select({
      id: organizations.id,
    })
    .from(organizations)
    .where(eq(organizations.slug, organizationSlug))

  return organization || null
}

export async function getOrganizationTeam(
  organizationSlug: OrganizationTeamParams['organizationSlug'],
  teamId: OrganizationTeamParams['teamId'],
) {
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
    .where(and(eq(teams.id, teamId), eq(organizations.slug, organizationSlug)))

  return organizationTeam || null
}

export async function updateActiveOrganizationTeam(
  organizationId?: string | null,
  teamId?: string | null,
) {
  await auth.api.setActiveOrganization({
    body: { organizationId: organizationId || null },
    headers: await headers(),
  })
  await auth.api.setActiveTeam({
    body: { teamId: teamId || null },
    headers: await headers(),
  })
}
