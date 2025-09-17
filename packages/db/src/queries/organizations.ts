import { eq } from 'drizzle-orm'
import { db } from '../db'
import { organizations } from '../schema/auth'

export async function getOrganizationSlugById({
  organizationId,
}: {
  organizationId: string | null | undefined
}) {
  if (!organizationId) {
    return null
  }

  const [organization] = await db
    .select({
      slug: organizations.slug,
    })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1)

  return organization?.slug || null
}

export async function getOrganizationIdBySlug({
  organizationSlug,
}: {
  organizationSlug: string | null | undefined
}) {
  if (!organizationSlug) {
    return null
  }

  const [organization] = await db
    .select({
      id: organizations.id,
    })
    .from(organizations)
    .where(eq(organizations.slug, organizationSlug))
    .limit(1)

  return organization?.id || null
}
