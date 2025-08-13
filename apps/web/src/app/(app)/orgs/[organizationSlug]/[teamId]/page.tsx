import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: {
  params: Promise<OrganizationTeamParams>
}) {
  const { organizationSlug, teamId } = await params

  if (organizationSlug === 'my-account') {
    return redirect('/orgs/my-account/~/overview')
  }

  if (teamId !== '~') {
    return redirect(`/orgs/${organizationSlug}/${teamId}/overview`)
  }

  return redirect(`/orgs/${organizationSlug}/~/select-team`)
}
