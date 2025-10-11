import { AbortTaskRunError, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { eq } from '@workspace/db/orm'
import { databaseConnections, sources, structured } from '@workspace/db/schema'
import { z } from 'zod'
import { python } from '../python'

export const getDbProperNounsTask = schemaTask({
  id: 'get-db-proper-nouns',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    const [source] = await db
      .select({
        id: sources.id,
        databaseConnectionId: sources.databaseConnectionId,
      })
      .from(sources)
      .where(eq(sources.id, payload.sourceId))

    if (!source) {
      throw new AbortTaskRunError('Source not found')
    }

    if (!source.databaseConnectionId) {
      throw new AbortTaskRunError('Database connection not found for source')
    }

    const [connection] = await db
      .select()
      .from(databaseConnections)
      .where(eq(databaseConnections.id, source.databaseConnectionId))

    if (!connection) {
      throw new AbortTaskRunError('Database connection not found')
    }

    if (!connection.dialect) {
      throw new AbortTaskRunError('Database dialect not found')
    }

    const [sourceStructured] = await db
      .select()
      .from(structured)
      .where(eq(structured.sourceId, payload.sourceId))

    if (!sourceStructured) {
      throw new AbortTaskRunError('Structured not found for source')
    }

    const tablesMetadata = sourceStructured.tablesColumnProperNouns?.map(
      (t) => ({
        name: t.name,
        columns: t.columns.map((c) => ({ name: c.name })),
      }),
    )

    const result = await python.getDbProperNouns({
      source_id: payload.sourceId,
      tables_metadata: tablesMetadata,
    })

    return result
  },
})
