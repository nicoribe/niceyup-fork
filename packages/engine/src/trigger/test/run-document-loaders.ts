import { logger, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { filesLoader } from '../../functions/document-loaders'

export const runDocumentLoadersTask = schemaTask({
  id: 'run-document-loaders',
  schema: z.object({
    ownerUserId: z.string(),
  }),
  run: async (payload) => {
    logger.warn('Payload', { payload })

    await logger.trace('Run Document Loaders', async () => {
      const docs = await filesLoader({
        filePaths: ['./tmp/.better-chat-engine/test/test_document_rag.pdf'],
      })

      logger.warn('Docs', { docs })
    })

    return {
      status: 'success',
      message: 'Document loaders ran successfully',
    }
  },
})
