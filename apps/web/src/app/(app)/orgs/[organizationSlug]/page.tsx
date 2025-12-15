import { getOrganizationIdBySlug } from '@/actions/organizations'
import { authenticatedUser } from '@/lib/auth/server'
import type { OrganizationTeamParams } from '@/lib/types'
import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug } = await params

  const isPersonalAccount = organizationSlug === 'my-account'

  if (isPersonalAccount) {
    return redirect('/orgs/my-account/~/overview')
  }

  const {
    session: { activeOrganizationId, activeTeamId },
  } = await authenticatedUser()

  const organizationId = await getOrganizationIdBySlug({ organizationSlug })

  if (activeOrganizationId === organizationId && activeTeamId) {
    return redirect(`/orgs/${organizationSlug}/${activeTeamId}/overview`)
  }

  return redirect(`/orgs/${organizationSlug}/~/select-team`)
}
