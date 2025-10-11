import { AbortTaskRunError, schemaTask } from '@trigger.dev/sdk'
import { db } from '@workspace/db'
import { eq } from '@workspace/db/orm'
import { sources } from '@workspace/db/schema'
import { z } from 'zod'

export const runIngestionTask = schemaTask({
  id: 'run-ingestion',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    const [source] = await db
      .select({
        id: sources.id,
      })
      .from(sources)
      .where(eq(sources.id, payload.sourceId))

    if (!source) {
      throw new AbortTaskRunError('Source not found')
    }

    // TODO: Implement ingestion

    return {
      status: 'success',
      message: 'Ingestion ran successfully',
    }
  },
})
