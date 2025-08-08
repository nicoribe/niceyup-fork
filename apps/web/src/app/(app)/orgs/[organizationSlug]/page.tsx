import { getOrganization } from '@/actions/organizations'
import { authenticatedUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: {
  params: Promise<{
    organizationSlug: string
  }>
}) {
  const {
    session: { activeOrganizationId, activeTeamId },
  } = await authenticatedUser()

  const { organizationSlug } = await params

  if (organizationSlug === 'my-account') {
    return redirect('/orgs/my-account/~/overview')
  }

  const organization = await getOrganization(organizationSlug)

  if (activeOrganizationId === organization?.id && activeTeamId) {
    return redirect(`/orgs/${organizationSlug}/${activeTeamId}/overview`)
  }

  return redirect(`/orgs/${organizationSlug}/~/select-team`)
}
