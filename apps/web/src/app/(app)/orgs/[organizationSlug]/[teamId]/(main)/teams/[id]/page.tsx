import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams & { id: string }>
}>) {
  const { organizationSlug, id: teamId } = await params

  return redirect(`/orgs/${organizationSlug}/~/teams/${teamId}/general`)
}
