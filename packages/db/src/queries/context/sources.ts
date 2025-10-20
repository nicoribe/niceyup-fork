import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { sources } from '../../schema'
import { getOrganizationIdBySlug } from '../organizations'
import { isOrganizationMemberAdmin } from './organizations'

type ContextListSourcesParams = {
  userId: string
} & (
  | {
      organizationId?: string | null
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug?: string | null
    }
)

export async function listSources(context: ContextListSourcesParams) {
  if (!context.organizationId && !context.organizationSlug) {
    const listSources = await db
      .select({
        id: sources.id,
        name: sources.name,
        type: sources.type,
        ownerUserId: sources.ownerUserId,
        ownerOrganizationId: sources.ownerOrganizationId,
      })
      .from(sources)
      .where(
        and(eq(sources.ownerUserId, context.userId), isNull(sources.deletedAt)),
      )

    return listSources
  }

  const orgId =
    context.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: context.organizationSlug,
    }))

  if (!orgId) {
    return []
  }

  const isAdmin = await isOrganizationMemberAdmin({
    userId: context.userId,
    organizationId: orgId,
  })

  if (isAdmin) {
    const listSources = await db
      .select({
        id: sources.id,
        name: sources.name,
        type: sources.type,
        ownerUserId: sources.ownerUserId,
        ownerOrganizationId: sources.ownerOrganizationId,
      })
      .from(sources)
      .where(
        and(eq(sources.ownerOrganizationId, orgId), isNull(sources.deletedAt)),
      )

    return listSources
  }

  return []
}

type ContextGetSourceParams = {
  userId: string
} & (
  | {
      organizationId?: string | null
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug?: string | null
    }
)

type GetSourceParams = {
  sourceId: string
}

export async function getSource(
  context: ContextGetSourceParams,
  params: GetSourceParams,
) {
  if (!context.organizationId && !context.organizationSlug) {
    const [source] = await db
      .select({
        id: sources.id,
        name: sources.name,
        type: sources.type,
        ownerUserId: sources.ownerUserId,
        ownerOrganizationId: sources.ownerOrganizationId,
      })
      .from(sources)
      .where(
        and(
          eq(sources.id, params.sourceId),
          eq(sources.ownerUserId, context.userId),
          isNull(sources.deletedAt),
        ),
      )
      .limit(1)

    return source || null
  }

  const orgId =
    context.organizationId ??
    (await getOrganizationIdBySlug({
      organizationSlug: context.organizationSlug,
    }))

  if (!orgId) {
    return null
  }

  const isAdmin = await isOrganizationMemberAdmin({
    userId: context.userId,
    organizationId: orgId,
  })

  if (isAdmin) {
    const [source] = await db
      .select({
        id: sources.id,
        name: sources.name,
        type: sources.type,
        ownerUserId: sources.ownerUserId,
        ownerOrganizationId: sources.ownerOrganizationId,
      })
      .from(sources)
      .where(
        and(
          eq(sources.id, params.sourceId),
          eq(sources.ownerOrganizationId, orgId),
          isNull(sources.deletedAt),
        ),
      )
      .limit(1)

    return source || null
  }

  return null
}
