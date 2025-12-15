import {
  getMembership,
  getOrganization,
  getOrganizationTeam,
} from '@/actions/organizations'
import { Header } from '@/components/organizations/header'
import { OrganizationNotFound } from '@/components/organizations/organization-not-found'
import { TabBar, type TabItem } from '@/components/organizations/tab-bar'
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

  const isPersonalAccount = organizationSlug === 'my-account' && teamId === '~'
  let organization = null

  if (teamId !== '~') {
    const organizationTeam = await getOrganizationTeam({
      organizationSlug,
      teamId,
    })

    organization = organizationTeam?.organization
  } else {
    organization = await getOrganization({ organizationSlug })
  }

  if (!isPersonalAccount && !organization) {
    return (
      <>
        <Header selectedOrganizationLabel="Not found" />

        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <OrganizationNotFound />
        </main>
      </>
    )
  }

  const {
    session: { activeOrganizationId, activeTeamId },
  } = await authenticatedUser()

  const currentTeamId =
    activeOrganizationId === organization?.id && teamId === '~'
      ? activeTeamId
      : teamId

  const tabs: TabItem[] = []

  if (isPersonalAccount || currentTeamId) {
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

  tabs.push({
    label: 'Agents',
    href: `/orgs/${organizationSlug}/${currentTeamId || '~'}/agents`,
    deep: true,
  })

  const member = await getMembership({ organizationSlug })

  const isAdmin = isPersonalAccount || member?.isAdmin

  if (isAdmin) {
    tabs.push(
      ...[
        {
          label: 'Providers',
          href: `/orgs/${organizationSlug}/~/providers`,
        },
        {
          label: 'Sources',
          href: `/orgs/${organizationSlug}/~/sources`,
        },
        {
          label: 'Connections',
          href: `/orgs/${organizationSlug}/~/connections`,
        },
      ],
    )
  }

  if (!isPersonalAccount) {
    tabs.push({
      label: 'Teams',
      href: `/orgs/${organizationSlug}/~/teams`,
      deep: true,
    })
  }

  tabs.push({
    label: 'Settings',
    href: `/orgs/${organizationSlug}/~/settings`,
    deep: true,
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
