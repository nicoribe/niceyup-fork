'use server'

import { authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'
import { queries } from '@workspace/db/queries'
import { cacheTag } from 'next/cache'

type GetTeamParams = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
  teamId: string
}

export async function getTeam({ organizationSlug, teamId }: GetTeamParams) {
  'use cache: private'
  cacheTag('update-team', 'delete-team')

  if (organizationSlug === 'my-account') {
    return null
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const team = await queries.context.getTeam(
    { userId, organizationSlug },
    { teamId },
  )

  return team
}

type ListTeamsParams = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
  search?: string
}

export async function listTeams({ organizationSlug, search }: ListTeamsParams) {
  'use cache: private'
  cacheTag('create-team')

  if (organizationSlug === 'my-account') {
    return []
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const teams = await queries.context.listTeams(
    { userId, organizationSlug },
    { search },
  )

  return teams
}

type ListTeamMembersParams = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
  teamId: string
}

export async function listTeamMembers({
  organizationSlug,
  teamId,
}: ListTeamMembersParams) {
  if (organizationSlug === 'my-account') {
    return []
  }

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const teamMembers = await queries.context.listTeamMembers(
    { userId, organizationSlug },
    { teamId },
  )

  return teamMembers
}
