import { type DBTransaction, db } from '../db'
import type { FileBucket, FileMetadata, FileScope } from '../lib/types'
import { files } from '../schema'

type CreateFileParams = {
  fileName: string
  fileMimeType: string
  fileSize: number
  filePath: string
  bucket: FileBucket
  scope: FileScope
  metadata?: FileMetadata
  ownerUserId?: string | null
  ownerOrganizationId?: string | null
}

export async function createFile(params: CreateFileParams, tx?: DBTransaction) {
  const [file] = await (tx || db)
    .insert(files)
    .values({
      fileName: params.fileName,
      fileMimeType: params.fileMimeType,
      fileSize: params.fileSize,
      filePath: params.filePath,
      bucket: params.bucket,
      scope: params.scope,
      metadata: params.metadata,
      ownerUserId: params.ownerUserId,
      ownerOrganizationId: params.ownerOrganizationId,
    })
    .returning({
      id: files.id,
      fileName: files.fileName,
      fileMimeType: files.fileMimeType,
      fileSize: files.fileSize,
      filePath: files.filePath,
      bucket: files.bucket,
      scope: files.scope,
      metadata: files.metadata,
      ownerUserId: files.ownerUserId,
      ownerOrganizationId: files.ownerOrganizationId,
    })

  return file || null
}
