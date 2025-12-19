import { isOrganizationMemberAdmin } from '@/actions/membership'
import { listTeamMembers } from '@/actions/teams'
import { authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'
import { TeamMemberList } from './_components/team-member-list'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { id: string }>
}>) {
  const { organizationSlug, id: teamId } = await params

  const {
    user: { id: userId },
  } = await authenticatedUser()

  const isAdmin = await isOrganizationMemberAdmin({ organizationSlug })

  const teamMembers = await listTeamMembers({ organizationSlug, teamId })

  return (
    <TeamMemberList
      params={{ organizationSlug, teamId }}
      userId={userId}
      isAdmin={isAdmin}
      teamMembers={teamMembers}
    />
  )
}
