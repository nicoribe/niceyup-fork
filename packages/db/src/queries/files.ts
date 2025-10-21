import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import type { FileBucket, FileMetadata, FileScope } from '../lib/types'
import { files } from '../schema'

type CreateFileParams = {
  fileName: string
  fileMimeType: string
  filePath: string
  bucket: FileBucket
  scope: FileScope
  metadata?: FileMetadata
  owner:
    | {
        userId: string
        organizationId?: never
      }
    | {
        userId?: never
        organizationId: string
      }
}

export async function createFile(params: CreateFileParams) {
  const ownerTypeCondition = params.owner.organizationId
    ? { ownerOrganizationId: params.owner.organizationId }
    : { ownerUserId: params.owner.userId }

  const [file] = await db
    .insert(files)
    .values({
      fileName: params.fileName,
      fileMimeType: params.fileMimeType,
      filePath: params.filePath,
      bucket: params.bucket,
      scope: params.scope,
      metadata: params.metadata,
      ...ownerTypeCondition,
    })
    .returning({
      id: files.id,
      fileName: files.fileName,
      fileMimeType: files.fileMimeType,
      filePath: files.filePath,
      bucket: files.bucket,
      scope: files.scope,
      metadata: files.metadata,
    })

  return file || null
}

type DeleteFileParams = {
  fileId: string
}

export async function deleteFile(params: DeleteFileParams) {
  await db
    .update(files)
    .set({ deletedAt: new Date() })
    .where(and(eq(files.id, params.fileId), isNull(files.deletedAt)))
}
