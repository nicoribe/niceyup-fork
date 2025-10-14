import { AbortTaskRunError, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { eq } from '@workspace/db/orm'
import {
  databaseConnections,
  sources,
  structuredSources,
} from '@workspace/db/schema'
import { z } from 'zod'
import { python } from '../python'

export const runDbReplicationTask = schemaTask({
  id: 'run-db-replication',
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

    if (!source.databaseConnectionId) {
      throw new AbortTaskRunError('Database connection not found for source')
    }

    const [connection] = await db
      .select()
      .from(databaseConnections)
      .where(eq(databaseConnections.id, source.databaseConnectionId))
      .limit(1)

    if (!connection) {
      throw new AbortTaskRunError('Database connection not found')
    }

    if (!connection.dialect) {
      throw new AbortTaskRunError('Database dialect not found')
    }

    const [structuredSource] = await db
      .select()
      .from(structuredSources)
      .where(eq(structuredSources.sourceId, payload.sourceId))
      .limit(1)

    if (!structuredSource) {
      throw new AbortTaskRunError('Structured source not found')
    }

    const tablesMetadata = structuredSource.tablesMetadata?.map((t) => ({
      name: t.name,
      columns: t.columns.map((c) => ({ name: c.name })),
    }))

    const result = await python.runDbReplication(
      {
        source_id: payload.sourceId,
        dialect: connection.dialect,
        file_path: connection.payload?.filePath,
        tables_metadata: tablesMetadata,
      },
      {
        envVars: {
          host: connection.payload?.host,
          port: connection.payload?.port,
          user: connection.payload?.user,
          password: connection.payload?.password,
          database: connection.payload?.database,
          schema: connection.payload?.schema,
        },
      },
    )

    return result
  },
})
