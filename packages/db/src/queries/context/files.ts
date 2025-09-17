import { db } from '../../db'
import { and, eq, isNull } from '../../orm'
import { files } from '../../schema'
import { getConversation } from './conversations'
import { getSource } from './sources'

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
  const [file] = await db
    .select({
      id: files.id,
      fileName: files.fileName,
      fileMimeType: files.fileMimeType,
      fileUri: files.fileUri,
      bucket: files.bucket,
      scope: files.scope,
      metadata: files.metadata,
      ownerId: files.ownerId,
    })
    .from(files)
    .where(and(eq(files.id, params.fileId), isNull(files.deletedAt)))
    .limit(1)

  if (file) {
    if (context.userId === file.ownerId) {
      return file
    }

    if (file.bucket === 'engine') {
      if (file.scope === 'sources' && file.metadata?.sourceId) {
        const source = await getSource(context, {
          sourceId: file.metadata.sourceId,
        })

        if (source) {
          return file
        }
      }
    } else {
      if (file.scope === 'conversations') {
        if (file.metadata?.conversationId) {
          const conversation = await getConversation(context, {
            conversationId: file.metadata.conversationId,
          })

          if (conversation) {
            return file
          }
        } else if (context.userId === file.metadata?.authorId) {
          return file
        }
      }

      if (file.scope === 'public') {
        return file
      }
    }
  }

  return null
}
