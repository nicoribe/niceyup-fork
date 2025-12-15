import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Layout({
  params,
  children,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
  children: React.ReactNode
}>) {
  const { organizationSlug, teamId } = await params

  const isPersonalAccount = organizationSlug === 'my-account' && teamId === '~'

  if (isPersonalAccount) {
    return redirect('/orgs/my-account/~/overview')
  }

  return children
}
