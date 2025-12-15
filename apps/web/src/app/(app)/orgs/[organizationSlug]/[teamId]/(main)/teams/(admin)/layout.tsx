import { getMembership } from '@/actions/organizations'
import { PermissionDenied } from '@/components/organizations/permission-denied'
import type { OrganizationTeamParams } from '@/lib/types'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
  children: React.ReactNode
}>) {
  const { organizationSlug } = await params

  const member = await getMembership({ organizationSlug })

  const isAdmin = member?.isAdmin

  if (!isAdmin) {
    return <PermissionDenied />
  }

  return children
}
