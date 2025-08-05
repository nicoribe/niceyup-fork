import { db } from '@workspace/db'
import { workspaces } from '@workspace/db/schema'

export const createWorkspace = async ({
  userId,
  organizationId,
}:
  | { userId: string; organizationId?: never }
  | { userId?: never; organizationId: string }) => {
  const [workspace] = await db
    .insert(workspaces)
    .values({
      userId,
      organizationId,
    })
    .returning()

  console.log('workspace created', workspace)
}
