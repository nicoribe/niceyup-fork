import { logger, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { python } from '../python'

const { sourceId, workspaceId } = {
  sourceId: 'xxxx-xxxx-xxxx-xxxx',
  workspaceId: 'xxxx-xxxx-xxxx-xxxx',
}

export const runIngestion = schemaTask({
  id: 'run-ingestion',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const result = await python.runIngestion({
      source_id: sourceId,
      workspace_id: workspaceId,
    })

    return result
  },
})
