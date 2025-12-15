import { getMembership } from '@/actions/organizations'
import { AgentNotFound } from '@/components/organizations/agent-not-found'
import { Header } from '@/components/organizations/header'
import { TabBar, type TabItem } from '@/components/organizations/tab-bar'
import { sdk } from '@/lib/sdk'
import type { OrganizationTeamParams } from '@/lib/types'
import { ChevronLeft } from 'lucide-react'
import { Topbar } from '../_components/topbar'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { agentId: string }>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId, agentId } = await params

  const isPersonalAccount = organizationSlug === 'my-account' && teamId === '~'

  const { data, error } = await sdk.getAgent({
    agentId,
    params: { organizationSlug, teamId },
  })

  if (error) {
    return (
      <>
        <Header organizationSlug={organizationSlug} teamId={teamId} />

        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <AgentNotFound organizationSlug={organizationSlug} teamId={teamId} />
        </main>
      </>
    )
  }

  const member = await getMembership({ organizationSlug })

  const isAdmin = isPersonalAccount || member?.isAdmin

  const tabs: TabItem[] = [
    {
      label: <ChevronLeft className="size-4" />,
      href: `/orgs/${organizationSlug}/${teamId}/agents`,
    },
    {
      label: 'Chats',
      href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats`,
      deep: true,
    },
  ]

  if (isAdmin) {
    tabs.push(
      ...[
        // {
        //   label: 'Activity',
        //   href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/activity`,
        // },
        // {
        //   label: 'Analytics',
        //   href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/analytics`,
        // },
        {
          label: 'Sources',
          href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/sources`,
          deep: true,
        },
        {
          label: 'Tools',
          href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/tools`,
        },
        // {
        //   label: 'Builder',
        //   href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/builder`,
        // },
        // {
        //   label: 'Deploy',
        //   href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/deploy`,
        // }
      ],
    )
  }

  tabs.push({
    label: 'Settings',
    href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/settings`,
    deep: true,
  })

  return (
    <>
      <Topbar>
        <Header
          organizationSlug={organizationSlug}
          teamId={teamId}
          activeAgent={data.agent}
        />

        <TabBar tabs={tabs} />
      </Topbar>

      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        {children}
      </main>
    </>
  )
}
