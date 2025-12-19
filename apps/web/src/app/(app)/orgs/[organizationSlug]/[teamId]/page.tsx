import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug, teamId } = await params

  return redirect(`/orgs/${organizationSlug}/${teamId}/overview`)
}
