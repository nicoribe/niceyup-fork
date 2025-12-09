import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug } = await params

  if (organizationSlug === 'my-account') {
    return redirect('/orgs/my-account/~/overview')
  }

  return <p className="text-sm">Select a team</p>
}
