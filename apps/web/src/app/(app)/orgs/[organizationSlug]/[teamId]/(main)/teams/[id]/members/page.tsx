import { getMembership } from '@/actions/organizations'
import { listTeamMembers } from '@/actions/teams'
import { authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'
import { TeamMembers } from '../_components/team-members'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { id: string }>
}>) {
  const { organizationSlug, id: teamId } = await params

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const member = await getMembership({ organizationSlug })

  const isAdmin = member?.isAdmin

  const teamMembers = await listTeamMembers({ organizationSlug, teamId })

  return (
    <TeamMembers
      params={{ organizationSlug, teamId }}
      userId={userId}
      isAdmin={isAdmin}
      teamMembers={teamMembers}
    />
  )
}
