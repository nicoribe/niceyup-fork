import { AbortTaskRunError, logger, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { eq } from '@workspace/db/orm'
import {
  databaseConnections,
  sources,
  structuredSources,
} from '@workspace/db/schema'
import { z } from 'zod'
import { getDbSchemaTask } from '../get-db-schema'
import { runDbReplicationTask } from '../run-db-replication'
import { runIngestionTask } from '../run-ingestion'

export const runDbReplicationAndIngestionTask = schemaTask({
  id: 'run-db-replication-and-ingestion',
  schema: z.object({
    ownerId: z.string(),
    databaseConnection: z.object({
      dialect: z.enum(['postgresql', 'mysql']),
      host: z.string(),
      port: z.string(),
      user: z.string(),
      password: z.string(),
      database: z.string(),
      schema: z.string().optional(),
    }),
  }),
  run: async (payload) => {
    const sourceId = await logger.trace('Create Source', async () => {
      return await db.transaction(async (tx) => {
        const [createDatabaseConnection] = await tx
          .insert(databaseConnections)
          .values({
            name: '(Test) Database Connection',
            dialect: payload.databaseConnection.dialect,
            payload: {
              host: payload.databaseConnection.host,
              port: payload.databaseConnection.port,
              user: payload.databaseConnection.user,
              password: payload.databaseConnection.password,
              database: payload.databaseConnection.database,
              schema: payload.databaseConnection.schema,
            },
            ownerId: payload.ownerId,
          })
          .returning()

        if (!createDatabaseConnection) {
          throw new AbortTaskRunError('Failed to create database connection')
        }

        const [createSource] = await tx
          .insert(sources)
          .values({
            name: '(Test) Structured Source',
            type: 'structured',
            databaseConnectionId: createDatabaseConnection.id,
            ownerId: payload.ownerId,
          })
          .returning()

        if (!createSource) {
          throw new AbortTaskRunError('Failed to create source')
        }

        const [createStructuredSource] = await tx
          .insert(structuredSources)
          .values({
            sourceId: createSource.id,
            tablesMetadata: [],
            queryExamples: [],
          })
          .returning()

        if (!createStructuredSource) {
          throw new AbortTaskRunError('Failed to create structured source')
        }

        return createSource.id
      })
    })

    await logger.trace('Get Database Schema', async () => {
      const result = await getDbSchemaTask.triggerAndWait({ sourceId }).unwrap()

      await logger.trace('Update Structured Source', async () => {
        await db
          .update(structuredSources)
          .set({
            tablesMetadata: result,
          })
          .where(eq(structuredSources.sourceId, sourceId))
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
