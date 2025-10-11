import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { structured } from '../../schema'
import { getSource } from './sources'

type ContextGetStructuredParams = {
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

type GetStructuredParams = {
  sourceId: string
}

export async function getStructured(
  context: ContextGetStructuredParams,
  params: GetStructuredParams,
) {
  const source = await getSource(context, {
    sourceId: params.sourceId,
  })

  // Check if user has access to the source
  if (!source) {
    return null
  }

  const [sourceStructured] = await db
    .select({
      id: structured.id,
      tablesMetadata: structured.tablesMetadata,
      tablesInfo: structured.tablesInfo,
      tablesColumnProperNouns: structured.tablesColumnProperNouns,
      queryExamples: structured.queryExamples,
    })
    .from(structured)
    .where(and(eq(structured.sourceId, params.sourceId)))
    .limit(1)

  return sourceStructured || null
}
