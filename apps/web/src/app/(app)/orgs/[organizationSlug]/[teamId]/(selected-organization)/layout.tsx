import {
  getOrganization,
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
  params: Promise<{ organizationSlug: string }>
  children: React.ReactNode
}>) {
  const { organizationSlug } = await params

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

  const {
    session: { activeOrganizationId, activeTeamId },
  } = await authenticatedUser()

  if (activeOrganizationId !== organization?.id) {
    await updateActiveOrganizationTeam(organization?.id)
  }

  return (
    <>
      <Header />

      <TabBar
        tabs={[
          organizationSlug === 'my-account' || activeTeamId
            ? {
                label: 'Overview',
                href: `/orgs/${organizationSlug}/${activeTeamId || '~'}/overview`,
              }
            : {
                label: 'Select Team',
                href: `/orgs/${organizationSlug}/~/select-team`,
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
