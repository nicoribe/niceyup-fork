import { AbortTaskRunError, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { and, eq } from '@workspace/db/orm'
import { databaseSources } from '@workspace/db/schema'
import { z } from 'zod'
import { python } from '../python'

export const executeQueryDbTask = schemaTask({
  id: 'execute-query-db',
  schema: z.object({
    sourceId: z.string(),
    query: z.string(),
    tableNames: z.array(z.string()),
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

    return await python.executeQueryDb({
      source_id: payload.sourceId,
      query: payload.query,
      table_names: payload.tableNames,
    })
  },
})
