import { getMembership, getOrganizationTeam } from '@/actions/organizations'
import { Header } from '@/components/organizations/header'
import { OrganizationNotFound } from '@/components/organizations/organization-not-found'
import { TabBar, type TabItem } from '@/components/organizations/tab-bar'
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

  const organizationTeam = await getOrganizationTeam({
    organizationSlug,
    teamId,
  })

  if (organizationSlug !== 'my-account' && !organizationTeam) {
    return (
      <>
        <Header selectedOrganizationLabel="Not found" />

        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <OrganizationNotFound />
        </main>
      </>
    )
  }

  const member = await getMembership({ organizationSlug })

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

  if (organizationSlug === 'my-account' || member?.isAdmin) {
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
      <Header organizationSlug={organizationSlug} teamId={teamId} />

      <TabBar tabs={tabs} />

      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        {children}
      </main>
    </>
  )
}
