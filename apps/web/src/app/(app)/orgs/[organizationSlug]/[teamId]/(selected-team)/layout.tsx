import {
  getOrganizationTeam,
  updateActiveOrganizationTeam,
} from '@/actions/organizations'
import { Header } from '@/components/organization/header'
import { OrganizationNotFound } from '@/components/organization/organization-not-found'
import { TabBar } from '@/components/organization/tab-bar'
import { authenticatedUser } from '@/lib/auth/server'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<{ organizationSlug: string; teamId: string }>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId } = await params

  const organizationTeam = await getOrganizationTeam(organizationSlug, teamId)

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

  const {
    session: { activeOrganizationId, activeTeamId },
  } = await authenticatedUser()

  if (
    activeOrganizationId !== organizationTeam?.organization.id ||
    activeTeamId !== organizationTeam?.team.id
  ) {
    await updateActiveOrganizationTeam(
      organizationTeam?.organization.id,
      organizationTeam?.team.id,
    )
  }

  return (
    <>
      <Header />

      <TabBar
        tabs={[
          {
            label: 'Overview',
            href: `/orgs/${organizationSlug}/${teamId}/overview`,
          },
          {
            label: 'Settings',
            href: `/orgs/${organizationSlug}/~/settings`,
          },
        ]}
      />

      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        {children}
      </main>
    </>
  )
}
