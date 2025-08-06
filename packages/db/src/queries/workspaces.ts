import { eq } from 'drizzle-orm'
import { db } from '../db'
import { workspaces } from '../schema'

type GetWorkspaceByIdParams = { id: string }

export const getWorkspaceById = async (params: GetWorkspaceByIdParams) => {
  const { id } = params

  const [result] = await db
    .select({
      id: workspaces.id,
      userId: workspaces.userId,
      organizationId: workspaces.organizationId,
    })
    .from(workspaces)
    .where(eq(workspaces.id, id))

  return result
}

type GetWorkspaceByUserIdParams = { userId: string }

export const getWorkspaceByUserId = async (
  params: GetWorkspaceByUserIdParams,
) => {
  const { userId } = params

  const [result] = await db
    .select({
      id: workspaces.id,
      userId: workspaces.userId,
      organizationId: workspaces.organizationId,
    })
    .from(workspaces)
    .where(eq(workspaces.userId, userId))

  return result
}

type GetWorkspaceByOrganizationIdParams = { organizationId: string }

export const getWorkspaceByOrganizationId = async (
  params: GetWorkspaceByOrganizationIdParams,
) => {
  const { organizationId } = params

  const [result] = await db
    .select({
      id: workspaces.id,
      userId: workspaces.userId,
      organizationId: workspaces.organizationId,
    })
    .from(workspaces)
    .where(eq(workspaces.organizationId, organizationId))

  return result
}

type CreateWorkspaceParams =
  | { userId: string; organizationId?: never }
  | { userId?: never; organizationId: string }

export const createWorkspace = async ({
  userId,
  organizationId,
}: CreateWorkspaceParams) => {
  const [result] = await db
    .insert(workspaces)
    .values({
      userId,
      organizationId,
    })
    .returning({
      id: workspaces.id,
    })

  return result
}
