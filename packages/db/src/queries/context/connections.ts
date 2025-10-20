import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import type { ConnectionApp } from '../../lib/types'
import { connections } from '../../schema'
import { getOrganizationIdBySlug } from '../organizations'
import { isOrganizationMemberAdmin } from './organizations'

type ContextListConnectionsParams = {
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

type ListConnectionsParams = {
  app?: ConnectionApp
}

export async function listConnections(
  context: ContextListConnectionsParams,
  params: ListConnectionsParams,
) {
  if (!context.organizationId && !context.organizationSlug) {
    const listConnections = await db
      .select({
        id: connections.id,
        app: connections.app,
        name: connections.name,
        payload: connections.payload,
      })
      .from(connections)
      .where(
        and(
          eq(connections.ownerUserId, context.userId),
          params.app ? eq(connections.app, params.app) : undefined,
        ),
      )

    return listConnections
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
    const listConnections = await db
      .select({
        id: connections.id,
        app: connections.app,
        name: connections.name,
        payload: connections.payload,
      })
      .from(connections)
      .where(
        and(
          eq(connections.ownerOrganizationId, orgId),
          params.app ? eq(connections.app, params.app) : undefined,
        ),
      )

    return listConnections
  }

  return []
}

type ContextGetConnectionParams = {
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

type GetConnectionParams = {
  connectionId: string
}

export async function getConnection(
  context: ContextGetConnectionParams,
  params: GetConnectionParams,
) {
  if (!context.organizationId && !context.organizationSlug) {
    const [connection] = await db
      .select({
        id: connections.id,
        app: connections.app,
        name: connections.name,
        payload: connections.payload,
      })
      .from(connections)
      .where(
        and(
          eq(connections.id, params.connectionId),
          eq(connections.ownerUserId, context.userId),
        ),
      )
      .limit(1)

    return connection || null
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
    const [connection] = await db
      .select({
        id: connections.id,
        app: connections.app,
        name: connections.name,
        payload: connections.payload,
      })
      .from(connections)
      .where(
        and(
          eq(connections.id, params.connectionId),
          eq(connections.ownerOrganizationId, orgId),
        ),
      )
      .limit(1)

    return connection || null
  }

  return null
}
