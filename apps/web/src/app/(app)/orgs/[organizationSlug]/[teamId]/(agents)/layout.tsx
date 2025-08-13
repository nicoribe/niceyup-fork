import {
  getOrganization,
  getOrganizationTeam,
  updateActiveOrganizationTeam,
} from '@/actions/organizations'
import { Header } from '@/components/organization/header'
import { OrganizationNotFound } from '@/components/organization/organization-not-found'
import { activeMember, authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId } = await params

  const organization = await getOrganization(organizationSlug)

  if (organizationSlug !== 'my-account' && !organization) {
    return (
      <>
        <Header />

        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <OrganizationNotFound />
        </main>
      </>
    )
  }

  const member = organizationSlug !== 'my-account' ? await activeMember() : null

  if (
    organizationSlug !== 'my-account' &&
    teamId === '~' &&
    member?.role !== 'owner' &&
    member?.role !== 'admin'
  ) {
    return redirect(`/orgs/${organizationSlug}/~/select-team`)
  }

  let organizationTeam = null

  if (teamId !== '~') {
    organizationTeam = await getOrganizationTeam(organizationSlug, teamId)

    if (organizationSlug !== 'my-account' && !organizationTeam) {
      return (
        <>
          <Header />

          <main className="flex flex-1 flex-col items-center justify-center gap-4">
            <OrganizationNotFound />
          </main>
        </>
      )
    }
  }

  const {
    session: { activeOrganizationId, activeTeamId },
  } = await authenticatedUser()

  if (
    activeOrganizationId !== organization?.id ||
    (organizationTeam && activeTeamId !== organizationTeam?.team.id)
  ) {
    await updateActiveOrganizationTeam(
      organization?.id,
      organizationTeam?.team.id,
    )
  }

  return <>{children}</>
}
