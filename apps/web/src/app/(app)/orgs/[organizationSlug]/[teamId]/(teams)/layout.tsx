import {
  getOrganizationTeam,
  updateActiveOrganizationTeam,
} from '@/actions/organizations'
import { Header } from '@/components/organization/header'
import { OrganizationNotFound } from '@/components/organization/organization-not-found'
import { TabBar, type TabItem } from '@/components/organization/tab-bar'
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

  if (organizationSlug !== 'my-account' && teamId === '~') {
    return redirect(`/orgs/${organizationSlug}/~/select-team`)
  }

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

  const member = await activeMember()

  const tabs: TabItem[] = [
    {
      label: 'Overview',
      href: `/orgs/${organizationSlug}/${teamId}/overview`,
    },
    {
      label: 'Agents',
      href: `/orgs/${organizationSlug}/${teamId}/agents`,
    },
  ]

  if (
    organizationSlug === 'my-account' ||
    member?.role === 'owner' ||
    member?.role === 'admin'
  ) {
    tabs.push(
      ...[
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
