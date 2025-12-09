import { getMembership } from '@/actions/organizations'
import { PermissionDenied } from '@/components/organizations/permission-denied'
import type { OrganizationTeamParams } from '@/lib/types'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug } = await params

  const member = await getMembership({ organizationSlug })

  if (organizationSlug !== 'my-account' && !member?.isAdmin) {
    return <PermissionDenied />
  }

  return <p className="text-sm">Create an agent</p>
}
