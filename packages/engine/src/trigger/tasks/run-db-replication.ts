import { AbortTaskRunError, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { and, eq } from '@workspace/db/orm'
import { connections, databaseSources, files } from '@workspace/db/schema'
import { z } from 'zod'
import { python } from '../python'

export const runDbReplicationTask = schemaTask({
  id: 'run-db-replication',
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

    if (!databaseSource.connectionId) {
      throw new AbortTaskRunError('Connection not found for database source')
    }

    const tablesMetadata = databaseSource.tablesMetadata?.map((t) => ({
      name: t.name,
      columns: t.columns.map((c) => ({ name: c.name })),
    }))

    switch (databaseSource.dialect) {
      case 'postgresql':
      case 'mysql':
        if (!databaseSource.connectionId) {
          throw new AbortTaskRunError(
            'Connection not found for database source',
          )
        }

        const [connection] = await db
          .select()
          .from(connections)
          .where(eq(connections.id, databaseSource.connectionId))
          .limit(1)

        if (!connection) {
          throw new AbortTaskRunError('Connection not found')
        }

        return await python.runDbReplication(
          {
            source_id: payload.sourceId,
            dialect: databaseSource.dialect,
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

      case 'sqlite':
        if (!databaseSource.fileId) {
          throw new AbortTaskRunError('File not found for database source')
        }

        const [file] = await db
          .select()
          .from(files)
          .where(eq(files.id, databaseSource.fileId))
          .limit(1)

        if (!file) {
          throw new AbortTaskRunError('File not found')
        }

        return await python.runDbReplication({
          source_id: payload.sourceId,
          dialect: databaseSource.dialect,
          file_path: file.filePath,
          tables_metadata: tablesMetadata,
        })

      default:
        throw new AbortTaskRunError('Unsupported dialect')
    }
  },
})
