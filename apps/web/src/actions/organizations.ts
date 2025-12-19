'use server'

import { authenticatedUser } from '@/lib/auth/server'
import { auth } from '@workspace/auth'
import { queries } from '@workspace/db/queries'
import { cacheTag } from 'next/cache'
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
  return await queries.getOrganizationIdBySlug({ organizationSlug })
}

type GetOrganizationParams = {
  organizationSlug: string
}

export async function getOrganization({
  organizationSlug,
}: GetOrganizationParams) {
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
  organizationSlug: string
  teamId: string
}

export async function getOrganizationTeam({
  organizationSlug,
  teamId,
}: GetOrganizationTeamParams) {
  const {
    user: { id: userId },
  } = await authenticatedUser()

  const organizationTeam = await queries.context.getOrganizationTeam(
    { userId },
    { organizationSlug, teamId },
  )

  return organizationTeam
}

export async function listOrganizations() {
  'use cache: private'
  cacheTag('update-organization')

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const organizations = await queries.context.listOrganizations({ userId })

  return organizations
}

type ListOrganizationTeamsParams = {
  organizationSlug: string
}

export async function listOrganizationTeams({
  organizationSlug,
}: ListOrganizationTeamsParams) {
  'use cache: private'
  cacheTag('create-team', 'update-team', 'delete-team')

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const organizationTeams = await queries.context.listOrganizationTeams(
    { userId },
    { organizationSlug },
  )

  return organizationTeams.map(({ team }) => team)
}

type ListOrganizationMembersParams = {
  organizationSlug: string
}

export async function listOrganizationMembers({
  organizationSlug,
}: ListOrganizationMembersParams) {
  'use cache: private'
  cacheTag('remove-member')

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const members = await queries.context.listOrganizationMembers({
    userId,
    organizationSlug,
  })

  return members
}

type SetActiveOrganizationTeamParams =
  | {
      organizationId?: string
      teamId?: never
    }
  | {
      organizationId: string
      teamId?: string | null
    }

export async function setActiveOrganizationTeam({
  organizationId,
  teamId,
}: SetActiveOrganizationTeamParams = {}) {
  await auth.api.setActiveOrganization({
    body: { organizationId: organizationId || null },
    headers: await headers(),
  })
  await auth.api.setActiveTeam({
    body: { teamId: teamId || null },
    headers: await headers(),
  })
}
