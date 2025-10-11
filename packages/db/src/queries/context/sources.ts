import { and, eq } from 'drizzle-orm'
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
        databaseConnectionId: sources.databaseConnectionId,
      })
      .from(sources)
      .where(eq(sources.ownerId, context.userId))

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
        databaseConnectionId: sources.databaseConnectionId,
      })
      .from(sources)
      .where(eq(sources.organizationId, orgId))

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
        databaseConnectionId: sources.databaseConnectionId,
      })
      .from(sources)
      .where(
        and(
          eq(sources.id, params.sourceId),
          eq(sources.ownerId, context.userId),
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
        databaseConnectionId: sources.databaseConnectionId,
      })
      .from(sources)
      .where(
        and(eq(sources.id, params.sourceId), eq(sources.organizationId, orgId)),
      )
      .limit(1)

    return source || null
  }

  return null
}
