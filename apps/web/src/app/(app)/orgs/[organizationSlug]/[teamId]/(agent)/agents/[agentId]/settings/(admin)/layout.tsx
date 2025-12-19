import { isOrganizationMemberAdmin } from '@/actions/membership'
import { PermissionDenied } from '@/components/permission-denied'
import type { OrganizationTeamParams } from '@/lib/types'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
  children: React.ReactNode
}>) {
  const { organizationSlug } = await params

  const isAdmin = await isOrganizationMemberAdmin({ organizationSlug })

  if (!isAdmin) {
    return (
      <div className="flex w-full flex-col">
        <div className="rounded-lg border bg-background p-4 py-24">
          <PermissionDenied />
        </div>
      </div>
    )
  }

  return children
}
