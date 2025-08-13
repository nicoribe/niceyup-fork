import { PermissionDenied } from '@/components/organization/permission-denied'
import { activeMember } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug } = await params

  const member = organizationSlug !== 'my-account' ? await activeMember() : null

  if (
    organizationSlug !== 'my-account' &&
    member?.role !== 'owner' &&
    member?.role !== 'admin'
  ) {
    return <PermissionDenied />
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-sm">Create an agent</h1>
    </div>
  )
}
