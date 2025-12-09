import { queries } from '@workspace/db/queries'

export async function getOrganizationContext({
  userId,
  organizationId,
  organizationSlug,
  teamId,
}: {
  userId: string
  organizationId?: string | null
  organizationSlug?: string | null
  teamId?: string | null
}) {
  const isOrganization =
    organizationId || (organizationSlug && organizationSlug !== 'my-account')

  if (isOrganization) {
    const orgId =
      organizationId ||
      (await queries.getOrganizationIdBySlug({ organizationSlug }))

    if (!orgId) {
      return null
    }

    return {
      userId,
      organizationId: orgId,
      teamId: teamId !== '~' ? teamId : undefined,
    }
  }

  return { userId }
}
