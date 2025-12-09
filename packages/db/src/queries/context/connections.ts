import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import type { ConnectionApp } from '../../lib/types'
import { connections } from '../../schema'
import { isOrganizationMemberAdmin } from './organizations'

type ContextListConnectionsParams = {
  userId: string
  organizationId?: string | null
}

type ListConnectionsParams = {
  app?: ConnectionApp
}

export async function listConnections(
  context: ContextListConnectionsParams,
  params: ListConnectionsParams,
) {
  const selectQuery = db
    .select({
      id: connections.id,
      app: connections.app,
      name: connections.name,
      payload: connections.payload,
    })
    .from(connections)

  if (context.organizationId) {
    const isAdmin = await isOrganizationMemberAdmin({
      userId: context.userId,
      organizationId: context.organizationId,
    })

    if (isAdmin) {
      const listConnections = await selectQuery.where(
        and(
          eq(connections.ownerOrganizationId, context.organizationId),
          params.app ? eq(connections.app, params.app) : undefined,
        ),
      )

      return listConnections
    }

    return []
  }

  const listConnections = await selectQuery.where(
    and(
      eq(connections.ownerUserId, context.userId),
      params.app ? eq(connections.app, params.app) : undefined,
    ),
  )

  return listConnections
}

type ContextGetConnectionParams = {
  userId: string
  organizationId?: string | null
}

type GetConnectionParams = {
  connectionId: string
}

export async function getConnection(
  context: ContextGetConnectionParams,
  params: GetConnectionParams,
) {
  const selectQuery = db
    .select({
      id: connections.id,
      app: connections.app,
      name: connections.name,
      payload: connections.payload,
      ownerUserId: connections.ownerUserId,
      ownerOrganizationId: connections.ownerOrganizationId,
    })
    .from(connections)

  if (context.organizationId) {
    const isAdmin = await isOrganizationMemberAdmin({
      userId: context.userId,
      organizationId: context.organizationId,
    })

    if (isAdmin) {
      const [connection] = await selectQuery
        .where(
          and(
            eq(connections.id, params.connectionId),
            eq(connections.ownerOrganizationId, context.organizationId),
          ),
        )
        .limit(1)

      return connection || null
    }

    return null
  }

  const [connection] = await selectQuery
    .where(
      and(
        eq(connections.id, params.connectionId),
        eq(connections.ownerUserId, context.userId),
      ),
    )
    .limit(1)

  return connection || null
}
