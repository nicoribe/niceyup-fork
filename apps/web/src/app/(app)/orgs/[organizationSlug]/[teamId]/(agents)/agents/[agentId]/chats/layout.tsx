import type { OrganizationTeamParams } from '@/lib/types'
import { LeftSidebar } from './_components/left-sidebar'
import { Resizable } from './_components/resizable'
import { RightSidebar } from './_components/right-sidebar'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { agentId: string }>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId, agentId } = await params

  return (
    <Resizable
      leftSidebar={
        <LeftSidebar params={{ organizationSlug, teamId, agentId }} />
      }
      rightSidebar={<RightSidebar />}
    >
      {children}
    </Resizable>
  )
}
