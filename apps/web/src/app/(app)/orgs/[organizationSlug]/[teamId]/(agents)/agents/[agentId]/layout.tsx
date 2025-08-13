import { AgentNotFound } from '@/components/organization/agent-not-found'
import { Header } from '@/components/organization/header'
import { TabBar, type TabItem } from '@/components/organization/tab-bar'
import { activeMember } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'
import { ChevronLeft } from 'lucide-react'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { agentId: string }>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId, agentId } = await params

  const agents = [
    { id: 'foo', name: 'Foo' },
    { id: 'bar', name: 'Bar' },
  ]

  const activeAgent = agents.find(({ id }) => id === agentId)

  if (!activeAgent) {
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
      <Header activeAgent={activeAgent} agents={agents} />

      <TabBar tabs={tabs} />

      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        {children}
      </main>
    </>
  )
}
