import { logger, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { filesLoader } from '../../functions/loaders'
import { documentSplitter } from '../../functions/splitters'

export const runFilesLoaderAndIngestorTask = schemaTask({
  id: 'run-files-loader-and-ingestor',
  schema: z.object({
    ownerUserId: z.string(),
  }),
  run: async (payload) => {
    logger.warn('Payload', { payload })

    const filePaths = [
      './tmp/.niceyup-engine/test/test_document_rag.csv',
      './tmp/.niceyup-engine/test/test_document_rag.doc',
      './tmp/.niceyup-engine/test/test_document_rag.docx',
      './tmp/.niceyup-engine/test/test_document_rag.json',
      './tmp/.niceyup-engine/test/test_document_rag.jsonl',
      './tmp/.niceyup-engine/test/test_document_rag.pdf',
      './tmp/.niceyup-engine/test/test_document_rag.pptx',
    ]

    const loadedDocuments = await filesLoader({ paths: filePaths })

    logger.warn('Loaded Documents', { loadedDocuments })

    const splitDocuments = await documentSplitter({
      documents: loadedDocuments,
      chunkSize: 2500,
      chunkOverlap: 100,
    })

    logger.warn('Split Documents', { splitDocuments })

    return {
      status: 'success',
      message: 'Document loaders ran successfully',
    }
  },
})
