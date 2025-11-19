import { AbortTaskRunError, logger, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { eq } from '@workspace/db/orm'
import { connections, databaseSources, sources } from '@workspace/db/schema'
import { z } from 'zod'
import { getDbSchemaTask } from '../get-db-schema'
import { runDbReplicationTask } from '../run-db-replication'
import { runIngestionTask } from '../run-ingestion'

export const runDbReplicatorAndIngestorTask = schemaTask({
  id: 'run-db-replicator-and-ingestor',
  schema: z.object({
    ownerUserId: z.string(),
    connection: z.object({
      app: z.enum(['postgresql', 'mysql']),
      payload: z.object({
        host: z.string(),
        port: z.string(),
        user: z.string(),
        password: z.string(),
        database: z.string(),
        schema: z.string().optional(),
      }),
    }),
  }),
  run: async (payload) => {
    const sourceId = await logger.trace('Create Source', async () => {
      return await db.transaction(async (tx) => {
        const [createSource] = await tx
          .insert(sources)
          .values({
            name: '(Test) Database Source',
            type: 'database',
            ownerUserId: payload.ownerUserId,
          })
          .returning()

        if (!createSource) {
          throw new AbortTaskRunError('Failed to create source')
        }

        const [createConnection] = await tx
          .insert(connections)
          .values({
            name: '(Test) PostgreSQL Connection',
            app: payload.connection.app,
            payload: payload.connection.payload,
            ownerUserId: payload.ownerUserId,
          })
          .returning()

        if (!createConnection) {
          throw new AbortTaskRunError('Failed to create connection')
        }

        const [createDatabaseSource] = await tx
          .insert(databaseSources)
          .values({
            dialect: payload.connection.app,
            sourceId: createSource.id,
            connectionId: createConnection.id,
          })
          .returning()

        if (!createDatabaseSource) {
          throw new AbortTaskRunError('Failed to create database source')
        }

        return createSource.id
      })
    })

    await logger.trace('Get Database Schema', async () => {
      const result = await getDbSchemaTask.triggerAndWait({ sourceId }).unwrap()

      await logger.trace('Update Database Source', async () => {
        await db
          .update(databaseSources)
          .set({
            tablesMetadata: result,
          })
          .where(eq(databaseSources.sourceId, sourceId))
      })
    })

    await logger.trace('Run Database Replication', async () => {
      await runDbReplicationTask.triggerAndWait({ sourceId })
    })

    await logger.trace('Run Ingestion', async () => {
      await runIngestionTask.triggerAndWait({ sourceId })
    })

    return {
      status: 'success',
      message: 'Task ran successfully',
    }
  },
})
