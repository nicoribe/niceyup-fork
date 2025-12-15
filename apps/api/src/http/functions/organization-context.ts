import { BadRequestError } from '@/http/errors/bad-request-error'
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
  if (
    organizationId ||
    (organizationSlug && organizationSlug !== 'my-account')
  ) {
    const orgId =
      organizationId ||
      (await queries.getOrganizationIdBySlug({ organizationSlug }))

    if (!orgId) {
      throw new BadRequestError({
        code: 'ORGANIZATION_NOT_FOUND',
        message: 'Organization not found',
      })
    }

    return {
      userId,
      organizationId: orgId,
      teamId: teamId !== '~' ? teamId : undefined,
    }
  }

  return { userId }
}

export function getNamespaceContext({
  userId,
  organizationId,
}: {
  userId: string
  organizationId?: string | null
}) {
  if (organizationId) {
    return `organization/${organizationId}`
  }

  return `user/${userId}`
}
