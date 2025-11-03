import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { files } from '../../schema'
import { getOrganizationIdBySlug } from '../organizations'
import { isOrganizationMemberAdmin } from './organizations'

type ContextGetFileParams = {
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
) & {
    teamId?: string | null
  }

type GetFileParams = {
  fileId: string
}

export async function getFile(
  context: ContextGetFileParams,
  params: GetFileParams,
) {
  if (!context.organizationId && !context.organizationSlug) {
    const [file] = await db
      .select({
        id: files.id,
        fileName: files.fileName,
        fileMimeType: files.fileMimeType,
        fileSize: files.fileSize,
        filePath: files.filePath,
        bucket: files.bucket,
        scope: files.scope,
        metadata: files.metadata,
      })
      .from(files)
      .where(
        and(eq(files.id, params.fileId), eq(files.ownerUserId, context.userId)),
      )
      .limit(1)

    return file || null
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
    const [file] = await db
      .select({
        id: files.id,
        fileName: files.fileName,
        fileMimeType: files.fileMimeType,
        fileSize: files.fileSize,
        filePath: files.filePath,
        bucket: files.bucket,
        scope: files.scope,
        metadata: files.metadata,
      })
      .from(files)
      .where(
        and(eq(files.id, params.fileId), eq(files.ownerOrganizationId, orgId)),
      )
      .limit(1)

    return file || null
  }

  return null
}
