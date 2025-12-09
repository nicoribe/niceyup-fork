import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { sources } from '../../schema'
import { isOrganizationMemberAdmin } from './organizations'

type ContextListSourcesParams = {
  userId: string
  organizationId?: string | null
}

export async function listSources(context: ContextListSourcesParams) {
  const selectQuery = db
    .select({
      id: sources.id,
      name: sources.name,
      type: sources.type,
    })
    .from(sources)

  if (context.organizationId) {
    const isAdmin = await isOrganizationMemberAdmin({
      userId: context.userId,
      organizationId: context.organizationId,
    })

    if (isAdmin) {
      const listSources = await selectQuery.where(
        and(
          eq(sources.ownerOrganizationId, context.organizationId),
          isNull(sources.deletedAt),
        ),
      )

      return listSources
    }

    return []
  }

  const listSources = await selectQuery.where(
    and(eq(sources.ownerUserId, context.userId), isNull(sources.deletedAt)),
  )

  return listSources
}

type ContextGetSourceParams = {
  userId: string
  organizationId?: string | null
}

type GetSourceParams = {
  sourceId: string
}

export async function getSource(
  context: ContextGetSourceParams,
  params: GetSourceParams,
) {
  const selectQuery = db
    .select({
      id: sources.id,
      name: sources.name,
      type: sources.type,
      ownerUserId: sources.ownerUserId,
      ownerOrganizationId: sources.ownerOrganizationId,
    })
    .from(sources)

  if (context.organizationId) {
    const isAdmin = await isOrganizationMemberAdmin({
      userId: context.userId,
      organizationId: context.organizationId,
    })

    if (isAdmin) {
      const [source] = await selectQuery
        .where(
          and(
            eq(sources.id, params.sourceId),
            eq(sources.ownerOrganizationId, context.organizationId),
            isNull(sources.deletedAt),
          ),
        )
        .limit(1)

      return source || null
    }

    return null
  }

  const [source] = await selectQuery
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
