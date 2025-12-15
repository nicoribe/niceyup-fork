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
  const { organizationSlug, teamId } = await params

  const isPersonalAccount = organizationSlug === 'my-account' && teamId === '~'

  const member = await getMembership({ organizationSlug })

  const isAdmin = isPersonalAccount || member?.isAdmin

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
