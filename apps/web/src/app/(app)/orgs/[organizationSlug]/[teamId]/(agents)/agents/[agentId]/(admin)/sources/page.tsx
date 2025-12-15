import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { agentId: string }>
}>) {
  const { organizationSlug, teamId, agentId } = await params

  return redirect(
    `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/sources/overview`,
  )
}
