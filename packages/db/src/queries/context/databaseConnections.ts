import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { databaseConnections } from '../../schema'
import { getOrganizationIdBySlug } from '../organizations'
import { isOrganizationMemberAdmin } from './organizations'

type ContextListDatabaseConnectionsParams = {
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

export async function listDatabaseConnections(
  context: ContextListDatabaseConnectionsParams,
) {
  if (!context.organizationId && !context.organizationSlug) {
    const listDatabaseConnections = await db
      .select({
        id: databaseConnections.id,
        name: databaseConnections.name,
        dialect: databaseConnections.dialect,
        payload: databaseConnections.payload,
      })
      .from(databaseConnections)
      .where(eq(databaseConnections.ownerId, context.userId))

    return listDatabaseConnections
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
    const listDatabaseConnections = await db
      .select({
        id: databaseConnections.id,
        name: databaseConnections.name,
        dialect: databaseConnections.dialect,
        payload: databaseConnections.payload,
      })
      .from(databaseConnections)
      .where(eq(databaseConnections.organizationId, orgId))

    return listDatabaseConnections
  }

  return []
}

type ContextGetDatabaseConnectionParams = {
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

type GetDatabaseConnectionParams = {
  databaseConnectionId: string
}

export async function getDatabaseConnection(
  context: ContextGetDatabaseConnectionParams,
  params: GetDatabaseConnectionParams,
) {
  if (!context.organizationId && !context.organizationSlug) {
    const [databaseConnection] = await db
      .select({
        id: databaseConnections.id,
        name: databaseConnections.name,
        dialect: databaseConnections.dialect,
        payload: databaseConnections.payload,
      })
      .from(databaseConnections)
      .where(
        and(
          eq(databaseConnections.id, params.databaseConnectionId),
          eq(databaseConnections.ownerId, context.userId),
        ),
      )
      .limit(1)

    return databaseConnection || null
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
    const [databaseConnection] = await db
      .select({
        id: databaseConnections.id,
        name: databaseConnections.name,
        dialect: databaseConnections.dialect,
        payload: databaseConnections.payload,
      })
      .from(databaseConnections)
      .where(
        and(
          eq(databaseConnections.id, params.databaseConnectionId),
          eq(databaseConnections.organizationId, orgId),
        ),
      )
      .limit(1)

    return databaseConnection || null
  }

  return null
}
