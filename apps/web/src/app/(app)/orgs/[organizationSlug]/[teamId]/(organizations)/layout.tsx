import {
  getOrganization,
  updateActiveOrganizationTeam,
} from '@/actions/organizations'
import { Header } from '@/components/organizations/header'
import { OrganizationNotFound } from '@/components/organizations/organization-not-found'
import { TabBar, type TabItem } from '@/components/organizations/tab-bar'
import { activeMember, authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
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

  const currentTeamId =
    activeOrganizationId === organization?.id ? activeTeamId : null

  const tabs: TabItem[] = []

  if (organizationSlug === 'my-account' || currentTeamId) {
    tabs.push({
      label: 'Overview',
      href: `/orgs/${organizationSlug}/${currentTeamId || '~'}/overview`,
    })
  } else {
    tabs.push({
      label: 'Select Team',
      href: `/orgs/${organizationSlug}/~/select-team`,
    })
  }

  const member = organizationSlug !== 'my-account' ? await activeMember() : null

  if (
    organizationSlug === 'my-account' ||
    member?.role === 'owner' ||
    member?.role === 'admin'
  ) {
    tabs.push(
      ...[
        {
          label: 'Agents',
          href: `/orgs/${organizationSlug}/${currentTeamId || '~'}/agents`,
        },
        {
          label: 'Sources',
          href: `/orgs/${organizationSlug}/~/sources`,
        },
        {
          label: 'Connections',
          href: `/orgs/${organizationSlug}/~/connections`,
        },
        {
          label: 'Integrations',
          href: `/orgs/${organizationSlug}/~/integrations`,
        },
      ],
    )

    if (organizationSlug !== 'my-account') {
      tabs.push({
        label: 'Teams',
        href: `/orgs/${organizationSlug}/~/teams`,
      })
    }
  } else {
    if (activeTeamId) {
      tabs.push({
        label: 'Agents',
        href: `/orgs/${organizationSlug}/${currentTeamId}/agents`,
      })
    }
  }

  // {
  //   label: 'Deploy',
  //   href: `/orgs/${organizationSlug}/~/deploy`,
  // },

  tabs.push({
    label: 'Settings',
    href: `/orgs/${organizationSlug}/~/settings`,
  })

  return (
    <>
      <Header />

      <TabBar tabs={tabs} />

      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        {children}
      </main>
    </>
  )
}
