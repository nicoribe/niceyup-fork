import { AbortTaskRunError, logger, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { eq } from '@workspace/db/orm'
import { databaseSources, sources } from '@workspace/db/schema'
import { z } from 'zod'
import {
  ingestDatabaseSource,
  ingestDatabaseSourceProperNouns,
  ingestDatabaseSourceQueryExamples,
  ingestDatabaseSourceTablesMetadata,
} from '../functions/ingestor'

export const runIngestionTask = schemaTask({
  id: 'run-ingestion',
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

    const namespace = source.ownerOrganizationId || source.ownerUserId

    if (!namespace) {
      throw new AbortTaskRunError('Namespace not found')
    }

    switch (source.type) {
      case 'file':
        await logger.trace('Ingest File Source', async () => {
          // TODO: Implement logic to ingest file source
        })
        break

      case 'text':
        await logger.trace('Ingest Text Source', async () => {
          // TODO: Implement logic to ingest text source
        })
        break

      case 'question-answer':
        await logger.trace('Ingest Question Answer Source', async () => {
          // TODO: Implement logic to ingest question answer source
        })
        break

      case 'website':
        await logger.trace('Ingest Website Source', async () => {
          // TODO: Implement logic to ingest website source
        })
        break

      case 'database':
        const [databaseSource] = await db
          .select()
          .from(databaseSources)
          .where(eq(databaseSources.sourceId, payload.sourceId))
          .limit(1)

        if (!databaseSource) {
          throw new AbortTaskRunError('Database source not found')
        }

        const { tablesMetadata, queryExamples } = databaseSource

        await logger.trace('Ingest Database Source', async () => {
          await ingestDatabaseSource({
            namespace,
            sourceId: payload.sourceId,
            tablesMetadata: tablesMetadata || [],
          })
        })

        await logger.trace(
          'Ingest Tables Metadata from Database Source',
          async () => {
            await ingestDatabaseSourceTablesMetadata({
              namespace,
              sourceId: payload.sourceId,
              tablesMetadata: tablesMetadata || [],
            })
          },
        )

        await logger.trace(
          'Ingest Proper Nouns from Database Source',
          async () => {
            await ingestDatabaseSourceProperNouns({
              namespace,
              sourceId: payload.sourceId,
            })
          },
        )

        await logger.trace(
          'Ingest Query Examples from Database Source',
          async () => {
            await ingestDatabaseSourceQueryExamples({
              namespace,
              sourceId: payload.sourceId,
              queryExamples: queryExamples || [],
            })
          },
        )
        break

      default:
        throw new AbortTaskRunError('Source type not supported')
    }

    return {
      status: 'success',
      message: 'Ingestion ran successfully',
    }
  },
})
