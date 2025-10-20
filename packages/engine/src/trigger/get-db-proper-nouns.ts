import { AbortTaskRunError, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { and, eq } from '@workspace/db/orm'
import { databaseSources } from '@workspace/db/schema'
import { z } from 'zod'
import { python } from '../python'

export const getDbProperNounsTask = schemaTask({
  id: 'get-db-proper-nouns',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    const [databaseSource] = await db
      .select()
      .from(databaseSources)
      .where(and(eq(databaseSources.sourceId, payload.sourceId)))
      .limit(1)

    if (!databaseSource) {
      throw new AbortTaskRunError('Database source not found')
    }

    const tablesMetadata = databaseSource.tablesMetadata
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
