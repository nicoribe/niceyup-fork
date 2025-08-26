import {
  getOrganization,
  getOrganizationTeam,
  setActiveOrganizationTeam,
} from '@/actions/organizations'
import { authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId } = await params

  const {
    session: { activeOrganizationId, activeTeamId },
  } = await authenticatedUser()

  const organization = await getOrganization({ organizationSlug })

  const organizationTeam = await getOrganizationTeam({
    organizationSlug,
    teamId,
  })

  if (organizationTeam) {
    if (organizationTeam.team.id !== (activeTeamId || null)) {
      await setActiveOrganizationTeam({
        organizationId: organizationTeam.organization.id,
        teamId: organizationTeam.team.id,
      })
    }
  } else {
    if ((organization?.id || null) !== (activeOrganizationId || null)) {
      await setActiveOrganizationTeam({
        organizationId: organization?.id,
      })
    }
  }

  return <>{children}</>
}
