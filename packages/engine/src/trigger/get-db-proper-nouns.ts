import { AbortTaskRunError, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { eq } from '@workspace/db/orm'
import { sources, structuredSources } from '@workspace/db/schema'
import { z } from 'zod'
import { python } from '../python'

export const getDbProperNounsTask = schemaTask({
  id: 'get-db-proper-nouns',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    const [source] = await db
      .select()
      .from(sources)
      .where(eq(sources.id, payload.sourceId))
      .limit(1)

    if (!source) {
      throw new AbortTaskRunError('Source not found')
    }

    const [structuredSource] = await db
      .select()
      .from(structuredSources)
      .where(eq(structuredSources.sourceId, payload.sourceId))
      .limit(1)

    if (!structuredSource) {
      throw new AbortTaskRunError('Structured source not found')
    }

    const tablesMetadata = structuredSource.tablesMetadata
      ?.map((t) => ({
        name: t.name,
        columns: t.columns
          .filter((c) => c.meta?.properNoun)
          .map((c) => ({ name: c.name })),
      }))
      .filter((t) => t.columns.length)

    const result = await python.getDbProperNouns({
      source_id: payload.sourceId,
      tables_metadata: tablesMetadata,
    })

    return result
  },
})
