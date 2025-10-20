import { AbortTaskRunError, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { and, eq } from '@workspace/db/orm'
import { connections, databaseSources } from '@workspace/db/schema'
import { z } from 'zod'
import { python } from '../python'

export const getDbSchemaTask = schemaTask({
  id: 'get-db-schema',
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

    const [connection] = await db
      .select()
      .from(connections)
      .where(eq(connections.id, databaseSource.connectionId))
      .limit(1)

    if (!connection) {
      throw new AbortTaskRunError('Connection not found')
    }

    const result = await python.getDbSchema(
      {
        dialect: databaseSource.dialect,
        // file_path: databaseSource.file.fileUri, TODO: Add file path
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
