import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { files } from '../../schema'
import { isOrganizationMemberAdmin } from './organizations'

type ContextGetFileParams = {
  userId: string
  organizationId?: string | null
  teamId?: string | null
}

type GetFileParams = {
  fileId: string
}

export async function getFile(
  context: ContextGetFileParams,
  params: GetFileParams,
) {
  const selectQuery = db
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

  if (context.organizationId) {
    const isAdmin = await isOrganizationMemberAdmin({
      userId: context.userId,
      organizationId: context.organizationId,
    })

    if (isAdmin) {
      const [file] = await selectQuery
        .where(
          and(
            eq(files.id, params.fileId),
            eq(files.ownerOrganizationId, context.organizationId),
          ),
        )
        .limit(1)

      return file || null
    }

    return null
  }

  const [file] = await selectQuery
    .where(
      and(eq(files.id, params.fileId), eq(files.ownerUserId, context.userId)),
    )
    .limit(1)

  return file || null
}
