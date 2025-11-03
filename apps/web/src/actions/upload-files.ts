'use server'

import { env } from '@/lib/env'
import { sdk } from '@/lib/sdk'
import type { OrganizationTeamParams } from '@/lib/types'

type ContextGenerateUploadSignatureParams = OrganizationTeamParams

export type GenerateUploadSignatureParams =
  | ({
      bucket: 'default'
    } & (
      | {
          scope: 'public'
          accept?: string
          maxFiles?: number
          maxSize?: number
          expires?: number
        }
      | {
          scope: 'conversations'
          agentId: string
          conversationId?: string | null
        }
    ))
  | ({
      bucket: 'engine'
    } & {
      scope: 'sources'
      sourceType?: 'file' | 'database'
      explorerNode?: { folderId?: string | null }
    })

export async function generateUploadSignature(
  context: ContextGenerateUploadSignatureParams,
  params: GenerateUploadSignatureParams,
) {
  const { data, error } =
    params.scope === 'sources'
      ? await sdk.generateUploadSignatureSource({
          data: {
            ...context,
            sourceType: params.sourceType,
            explorerNode: params.explorerNode,
          },
        })
      : params.scope === 'conversations'
        ? await sdk.generateUploadSignatureConversation({
            data: {
              ...context,
              agentId: params.agentId,
              conversationId: params.conversationId,
            },
          })
        : await sdk.generateUploadSignature({
            data: {
              ...context,
              accept: params.accept,
              maxFiles: params.maxFiles,
              maxSize: params.maxSize,
              expires: params.expires,
            },
            headers: {
              'x-app-secret-key': env.APP_SECRET_KEY,
            },
          })

  if (error) {
    return { error: { ...error } }
  }

  return { data: { signature: data.signature } }
}
