'use server'

import { authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'
import { auth } from '@workspace/auth'
import { queries } from '@workspace/db/queries'
import { headers } from 'next/headers'

type GetOrganizationSlugByIdParams = {
  organizationId: string | null | undefined
}

export async function getOrganizationSlugById({
  organizationId,
}: GetOrganizationSlugByIdParams) {
  return await queries.getOrganizationSlugById({ organizationId })
}

type GetOrganizationIdBySlugParams = {
  organizationSlug: string | null | undefined
}

export async function getOrganizationIdBySlug({
  organizationSlug,
}: GetOrganizationIdBySlugParams) {
  if (organizationSlug === 'my-account') {
    return null
  }

  return await queries.getOrganizationIdBySlug({ organizationSlug })
}

type GetOrganizationParams = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
}

export async function getOrganization({
  organizationSlug,
}: GetOrganizationParams) {
  if (organizationSlug === 'my-account') {
    return null
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const organization = await queries.context.getOrganization(
    { userId },
    { organizationSlug },
  )

  return organization
}

type GetOrganizationTeamParams = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
  teamId: OrganizationTeamParams['teamId']
}

export async function getOrganizationTeam({
  organizationSlug,
  teamId,
}: GetOrganizationTeamParams) {
  if (organizationSlug === 'my-account' || teamId === '~') {
    return null
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const organizationTeam = await queries.context.getOrganizationTeam(
    { userId },
    { organizationSlug, teamId },
  )

  return organizationTeam
}

type GetMembershipParams = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
}

export async function getMembership({ organizationSlug }: GetMembershipParams) {
  if (organizationSlug === 'my-account') {
    return null
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const membership = await queries.context.getMembership({
    userId,
    organizationSlug,
  })

  return membership
}

export async function listOrganizations() {
  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  })

  return organizations
}

type ListOrganizationTeamsParams = {
  organizationId?: string | null
}

export async function listOrganizationTeams({
  organizationId,
}: ListOrganizationTeamsParams) {
  if (!organizationId) {
    return []
  }

  const organizationTeams = await auth.api.listOrganizationTeams({
    query: {
      organizationId,
    },
    headers: await headers(),
  })

  return organizationTeams
}

type SetActiveOrganizationTeamParams = {
  organizationId?: string | null
  teamId?: string | null
}

export async function setActiveOrganizationTeam({
  organizationId,
  teamId,
}: SetActiveOrganizationTeamParams = {}) {
  const activeOrganization = await auth.api.setActiveOrganization({
    body: {
      organizationId: organizationId || null,
    },
    headers: await headers(),
  })

  const activeTeam = await auth.api.setActiveTeam({
    body: {
      teamId: teamId || null,
    },
    headers: await headers(),
  })

  return { activeOrganization, activeTeam }
}
