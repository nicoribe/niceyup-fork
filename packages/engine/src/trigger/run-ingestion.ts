import { AbortTaskRunError, logger, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { eq } from '@workspace/db/orm'
import { sources, structuredSources } from '@workspace/db/schema'
import { z } from 'zod'
import {
  ingestStructuredSource,
  ingestStructuredSourceProperNouns,
  ingestStructuredSourceQueryExamples,
  ingestStructuredSourceTablesMetadata,
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

    const namespace = source.organizationId || source.ownerId

    if (!namespace) {
      throw new AbortTaskRunError('Namespace not found')
    }

    switch (source.type) {
      case 'structured':
        const [structuredSource] = await db
          .select()
          .from(structuredSources)
          .where(eq(structuredSources.sourceId, payload.sourceId))
          .limit(1)

        if (!structuredSource) {
          throw new AbortTaskRunError('Structured source not found')
        }

        const { tablesMetadata, queryExamples } = structuredSource

        await logger.trace('Ingest Structured Source', async () => {
          await ingestStructuredSource({
            namespace,
            sourceId: payload.sourceId,
            tablesMetadata: tablesMetadata || [],
          })
        })

        await logger.trace('Ingest Tables Metadata from Source', async () => {
          await ingestStructuredSourceTablesMetadata({
            namespace,
            sourceId: payload.sourceId,
            tablesMetadata: tablesMetadata || [],
          })
        })

        await logger.trace('Ingest Proper Nouns from Source', async () => {
          await ingestStructuredSourceProperNouns({
            namespace,
            sourceId: payload.sourceId,
          })
        })

        await logger.trace('Ingest Query Examples from Source', async () => {
          await ingestStructuredSourceQueryExamples({
            namespace,
            sourceId: payload.sourceId,
            queryExamples: queryExamples || [],
          })
        })
        break

      default:
        await logger.trace('Ingest Source', async () => {
          // TODO: Implement logic to ingest source
        })
        break
    }

    return {
      status: 'success',
      message: 'Ingestion ran successfully',
    }
  },
})
