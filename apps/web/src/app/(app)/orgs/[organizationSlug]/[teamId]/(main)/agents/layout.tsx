import { getOrganizationTeam } from '@/actions/organizations'
import { OrganizationNotFound } from '@/components/organizations/organization-not-found'
import type { OrganizationTeamParams } from '@/lib/types'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId } = await params

  const isPersonalAccount = organizationSlug === 'my-account' && teamId === '~'

  if (teamId !== '~') {
    const organizationTeam = await getOrganizationTeam({
      organizationSlug,
      teamId,
    })

    if (!isPersonalAccount && !organizationTeam) {
      return <OrganizationNotFound />
    }
  }

  return children
}
