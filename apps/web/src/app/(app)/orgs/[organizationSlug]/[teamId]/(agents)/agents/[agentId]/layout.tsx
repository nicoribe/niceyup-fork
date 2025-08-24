import { AgentNotFound } from '@/components/organizations/agent-not-found'
import { Header } from '@/components/organizations/header'
import { TabBar, type TabItem } from '@/components/organizations/tab-bar'
import { activeMember } from '@/lib/auth/server'
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

  const { data, error } = await sdk.getAgent({ agentId })

  if (error) {
    return (
      <>
        <Header />

        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <AgentNotFound organizationSlug={organizationSlug} teamId={teamId} />
        </main>
      </>
    )
  }

  const member = organizationSlug !== 'my-account' ? await activeMember() : null

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

  if (
    organizationSlug === 'my-account' ||
    member?.role === 'owner' ||
    member?.role === 'admin'
  ) {
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
        },
        {
          label: 'Tools',
          href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/tools`,
        },
      ],
    )
  }

  tabs.push({
    label: 'Settings',
    href: `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/settings`,
  })

  return (
    <>
      <Topbar>
        <Header activeAgent={data.agent} />

        <TabBar tabs={tabs} />
      </Topbar>

      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        {children}
      </main>
    </>
  )
}
