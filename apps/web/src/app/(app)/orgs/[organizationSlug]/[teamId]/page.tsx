import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug, teamId } = await params

  const isPersonalAccount = organizationSlug === 'my-account' && teamId === '~'

  if (isPersonalAccount) {
    return redirect('/orgs/my-account/~/overview')
  }

  if (teamId !== '~') {
    return redirect(`/orgs/${organizationSlug}/${teamId}/overview`)
  }

  return redirect(`/orgs/${organizationSlug}/~/select-team`)
}
