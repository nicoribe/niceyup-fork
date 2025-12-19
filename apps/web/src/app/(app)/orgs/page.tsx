import { getOrganizationSlugById } from '@/actions/organizations'
import { authenticatedUser } from '@/lib/auth/server'
import { queries } from '@workspace/db/queries'
import { redirect } from 'next/navigation'

export default async function Page() {
  const {
    session: { activeOrganizationId, activeTeamId },
    user: { id: userId },
  } = await authenticatedUser()

  if (activeOrganizationId) {
    const organizationSlug = await getOrganizationSlugById({
      organizationId: activeOrganizationId,
    })

    if (organizationSlug) {
      return redirect(
        `/orgs/${organizationSlug}/${activeTeamId || '~'}/overview`,
      )
    }
  }

  const organization = await queries.context.getFirstOrganization({ userId })

  if (organization?.slug) {
    return redirect(`/orgs/${organization.slug}/~/overview`)
  }

  return redirect('/onboarding/create-organization')
}
