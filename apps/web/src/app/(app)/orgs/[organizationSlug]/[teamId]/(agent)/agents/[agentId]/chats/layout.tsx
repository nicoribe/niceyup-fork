import type { AgentParams, OrganizationTeamParams } from '@/lib/types'
import { PrimarySidebar } from './_components/primary-sidebar'
import { Resizable } from './_components/resizable'
import { SecondarySidebar } from './_components/secondary-sidebar'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams & AgentParams>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId, agentId } = await params

  return (
    <Resizable
      primarySidebar={
        <PrimarySidebar params={{ organizationSlug, teamId, agentId }} />
      }
      secondarySidebar={<SecondarySidebar />}
    >
      {children}
    </Resizable>
  )
}
