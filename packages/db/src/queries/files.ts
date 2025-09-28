import { db } from '../db'
import { and, eq, isNull, sql } from '../lib/orm'
import type { FileBucket, FileMetadata, FileScope } from '../lib/types'
import { files } from '../schema'

type CreateFileParams = {
  fileName: string
  fileMimeType: string
  fileUri: string
  bucket: FileBucket
  scope: FileScope
  metadata?: FileMetadata
} & (
  | {
      ownerId: string
      organizationId?: never
    }
  | {
      ownerId?: never
      organizationId: string
    }
)

export async function createFile({
  fileName,
  fileMimeType,
  fileUri,
  bucket,
  scope,
  metadata,
  ownerId,
  organizationId,
}: CreateFileParams) {
  const ownerTypeCondition = ownerId ? { ownerId } : { organizationId }

  const [file] = await db
    .insert(files)
    .values({
      fileName,
      fileMimeType,
      fileUri,
      bucket,
      scope,
      ...ownerTypeCondition,
    })
    .returning({
      id: files.id,
      fileName: files.fileName,
      fileMimeType: files.fileMimeType,
      fileUri: files.fileUri,
      bucket: files.bucket,
      scope: files.scope,
    })

  if (file && metadata) {
    await db
      .update(files)
      .set({
        metadata: sql`COALESCE(${files.metadata}, '{}'::jsonb) || ${JSON.stringify(metadata)}::jsonb`,
      })
      .where(eq(files.id, file.id))
  }

  return file || null
}

export async function deleteFile({ fileId }: { fileId: string }) {
  await db
    .update(files)
    .set({ deletedAt: new Date() })
    .where(and(eq(files.id, fileId), isNull(files.deletedAt)))
}
