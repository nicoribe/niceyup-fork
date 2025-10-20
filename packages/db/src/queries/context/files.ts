import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../../db'
import { files } from '../../schema'
import { getOrganizationIdBySlug } from '../organizations'
import { getAgent } from './agents'
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
  let ownerTypeCondition = eq(files.ownerUserId, context.userId)

  let orgId: string | null = null

  if (context.organizationId || context.organizationSlug) {
    orgId =
      context.organizationId ||
      (await getOrganizationIdBySlug({
        organizationSlug: context.organizationSlug,
      }))
  }

  if (orgId) {
    ownerTypeCondition = eq(files.ownerOrganizationId, orgId)
  }

  const [file] = await db
    .select({
      id: files.id,
      fileName: files.fileName,
      fileMimeType: files.fileMimeType,
      fileUri: files.fileUri,
      bucket: files.bucket,
      scope: files.scope,
      metadata: files.metadata,
      ownerUserId: files.ownerUserId,
      ownerOrganizationId: files.ownerOrganizationId,
    })
    .from(files)
    .where(
      and(
        eq(files.id, params.fileId),
        isNull(files.deletedAt),
        ownerTypeCondition,
      ),
    )
    .limit(1)

  if (file) {
    if (
      file.scope === 'public' ||
      context.userId === file.ownerUserId ||
      context.userId === file.metadata?.authorId
    ) {
      return file
    }

    if (orgId === file.ownerOrganizationId) {
      // C
      if (
        file.bucket === 'engine' &&
        file.scope === 'sources' &&
        file.metadata?.sourceId
      ) {
        const source = await getSource(context, {
          sourceId: file.metadata.sourceId,
        })

        if (source) {
          return file
        }
      }

      if (
        file.bucket === 'default' &&
        file.scope === 'conversations' &&
        file.metadata?.agentId
      ) {
        if (file.metadata?.conversationId) {
          const conversation = await getConversation(context, {
            agentId: file.metadata.agentId,
            conversationId: file.metadata.conversationId,
          })

          if (conversation) {
            return file
          }
        } else {
          const agent = await getAgent(context, {
            agentId: file.metadata.agentId,
          })

          if (agent) {
            return file
          }
        }
      }
    }
  }

  return null
}
