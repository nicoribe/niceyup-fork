import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { structuredSources } from '../../schema'
import { getSource } from './sources'

type ContextGetStructuredSourceParams = {
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

type GetStructuredSourceParams = {
  sourceId: string
}

export async function getStructuredSource(
  context: ContextGetStructuredSourceParams,
  params: GetStructuredSourceParams,
) {
  const source = await getSource(context, {
    sourceId: params.sourceId,
  })

  // Check if user has access to the source
  if (!source) {
    return null
  }

  const [structuredSource] = await db
    .select({
      id: structuredSources.id,
      tablesMetadata: structuredSources.tablesMetadata,
      queryExamples: structuredSources.queryExamples,
    })
    .from(structuredSources)
    .where(and(eq(structuredSources.sourceId, params.sourceId)))
    .limit(1)

  return structuredSource || null
}
