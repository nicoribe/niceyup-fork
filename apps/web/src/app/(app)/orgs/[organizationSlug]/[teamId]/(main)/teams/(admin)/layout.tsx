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
    return <PermissionDenied />
  }

  return children
}
