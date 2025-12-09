import { getMembership } from '@/actions/organizations'
import { PermissionDenied } from '@/components/organizations/permission-denied'
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

  const member = await getMembership({ organizationSlug })

  if (!member?.isAdmin) {
    return <PermissionDenied />
  }

  return <p className="text-sm">Create a team</p>
}
