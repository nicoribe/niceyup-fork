import { eq } from 'drizzle-orm'
import { db } from '../db'
import { organizations } from '../schema/auth'

type GetOrganizationSlugByIdParams = {
  organizationId: string | null | undefined
}

export async function getOrganizationSlugById(
  params: GetOrganizationSlugByIdParams,
) {
  if (!params.organizationId) {
    return null
  }

  const [organization] = await db
    .select({
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.id, params.organizationId))
    .limit(1)

  return organization?.slug || null
}

type GetOrganizationIdBySlugParams = {
  organizationSlug: string | null | undefined
}

export async function getOrganizationIdBySlug(
  params: GetOrganizationIdBySlugParams,
) {
  if (!params.organizationSlug) {
    return null
  }

  const [organization] = await db
    .select({
      id: organizations.id,
    })
    .from(organizations)
    .where(eq(organizations.slug, params.organizationSlug))
    .limit(1)

  return organization?.id || null
}
