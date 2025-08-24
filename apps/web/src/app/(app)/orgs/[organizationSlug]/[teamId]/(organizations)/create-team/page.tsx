import { PermissionDenied } from '@/components/organizations/permission-denied'
import { activeMember } from '@/lib/auth/server'
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

  const member = await activeMember()

  if (member?.role !== 'owner' && member?.role !== 'admin') {
    return <PermissionDenied />
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-sm">Create a team</h1>
    </div>
  )
}
