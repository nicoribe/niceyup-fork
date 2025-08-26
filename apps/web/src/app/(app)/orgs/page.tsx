import { getOrganizationSlugById } from '@/actions/organizations'
import { authenticatedUser } from '@/lib/auth/server'
import { redirect } from 'next/navigation'

export default async function Page() {
  const {
    session: { activeOrganizationId, activeTeamId },
  } = await authenticatedUser()

  if (activeOrganizationId) {
    const organizationSlug = await getOrganizationSlugById({
      organizationId: activeOrganizationId,
    })

    if (organizationSlug) {
      if (activeTeamId) {
        return redirect(`/orgs/${organizationSlug}/${activeTeamId}/overview`)
      }

      return redirect(`/orgs/${organizationSlug}/~/select-team`)
    }
  }

  return redirect('/orgs/my-account/~/overview')
}
