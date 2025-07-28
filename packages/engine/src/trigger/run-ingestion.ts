import { logger, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { python } from '../python'

const { workspaceId, sourceId, sourceType } = {
  workspaceId: 'xxxx-xxxx-xxxx-xxxx',
  sourceId: 'xxxx-xxxx-xxxx-xxxx',
  sourceType: 'structured' as const,
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
      source_type: sourceType,
      // tables_info: tablesInfo,
      // columns_proper_names_by_tables: columnsProperNamesByTables,
      // query_examples: queryExamples,
    })

    return result
  },
})
