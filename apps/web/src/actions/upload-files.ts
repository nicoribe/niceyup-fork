'use server'

import { env } from '@/lib/env'
import { sdk } from '@/lib/sdk'
import type { OrganizationTeamParams } from '@/lib/types'

type ContextGenerateUploadSignatureParams = OrganizationTeamParams

type GenerateUploadSignatureParams = (
  | ({
      bucket: 'default'
    } & (
      | { scope: 'public' }
      | {
          scope: 'conversations'
          metadata: { agentId: string; conversationId: string | null }
        }
    ))
  | ({
      bucket: 'engine'
    } & {
      scope: 'sources'
      metadata: { sourceId: string }
    })
) & {
  accept: string
  expires: number
}

export async function generateUploadSignature(
  context: ContextGenerateUploadSignatureParams,
  params: GenerateUploadSignatureParams,
) {
  const { data, error } = await sdk.generateUploadSignature({
    data: { ...context, ...params },
    headers: {
      'x-api-key': env.API_KEY,
    },
  })

  if (error) {
    return { error: { ...error } }
  }

  return { data: { signature: data.signature } }
}
