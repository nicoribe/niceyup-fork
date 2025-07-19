import { logger, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { python } from '../python'

const { workspaceId, sourceId } = {
  workspaceId: 'xxxx-xxxx-xxxx-xxxx',
  sourceId: 'xxxx-xxxx-xxxx-xxxx',
}

export const runIngestionTask = schemaTask({
  id: 'run-ingestion',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const result = await python.runIngestion({
      workspace_id: workspaceId,
      source_id: sourceId,
    })

    return result
  },
})
