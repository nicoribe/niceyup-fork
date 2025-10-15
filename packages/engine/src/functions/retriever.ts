import { logger } from '@trigger.dev/sdk'
import { Output, generateText, stepCountIs } from '@workspace/ai'
import { z } from 'zod'
import { python } from '../python'
import { SearchProperNounsTool } from './ai-tools'
import { languageModel } from './models'
import {
  templatePromptQueryEnhancementWithProperNouns,
  templatePromptWriteQuery,
} from './prompts'
import { createSchema } from './utils'
import { vectorStoreQuery } from './vector-store'

export async function retrieveSources({
  namespace,
  question,
}: { namespace: string; question: string }) {
  logger.warn('Input', { input: { namespace, question } })

  const documents = await logger.trace('Retrieve Documents', async () => {
    const documents = await vectorStoreQuery({
      namespace,
      collection: 'sources',
      query: question,
      topK: 10,
    })

    logger.warn('Retrieved Documents', { documents })

    return documents
  })

  const unstructedDocuments = []

  const uniqueStructuredDocuments = new Map<
    string,
    (typeof documents)[number]
  >()

  for (const document of documents) {
    if (document.sourceType === 'structured') {
      if (!uniqueStructuredDocuments.has(document.sourceId)) {
        uniqueStructuredDocuments.set(document.sourceId, document)
      }
    } else {
      unstructedDocuments.push(document)
    }
  }

  const structuredDocuments = Array.from(uniqueStructuredDocuments.values())

  const structuredDocumentsContent = await Promise.all(
    structuredDocuments.map(async (document) => {
      const structuredContent = await retrieveStructuredSourceTablesMetadata({
        namespace,
        question,
        sourceId: document.sourceId,
      })

      return `<source id="${document.sourceId}" type="structured">${structuredContent}</source>`
    }),
  )

  const unstructedDocumentsContent = unstructedDocuments.map(
    (document) =>
      `<source id="${document.sourceId}" type="${document.sourceType}">${document.data.content}</source>`,
  )

  const documentsContent = [
    ...structuredDocumentsContent,
    ...unstructedDocumentsContent,
  ]

  logger.warn('Output', { output: { documentsContent } })

  return documentsContent
}

export async function retrieveStructuredSourceTablesMetadata({
  namespace,
  question,
  sourceId,
}: { namespace: string; question: string; sourceId: string }) {
  const relevantDocuments = await logger.trace(
    'Retrieve Relevant Documents',
    async () => {
      const [relevantTablesMetadata, relevantQueryExamples] = await Promise.all(
        [
          vectorStoreQuery({
            namespace,
            collection: 'tables-metadata',
            sourceId,
            query: question,
            topK: 10,
          }),

          vectorStoreQuery({
            namespace,
            collection: 'query-examples',
            sourceId,
            query: question,
            topK: 10,
          }),
        ],
      )

      logger.warn('Retrieved Relevant Documents', {
        relevantDocuments: { relevantTablesMetadata, relevantQueryExamples },
      })

      const tablesMetadata = relevantTablesMetadata.map(
        (t) => t.data.metadata.tableMetadata,
      )

      const tables = tablesMetadata.map((t) => t.name)

      const schema = createSchema(tablesMetadata)

      const queryExamples = relevantQueryExamples
        .map((q) => q.data.content)
        .join('\n')

      logger.warn('Relevant Documents', { tables, schema, queryExamples })

      return { tables, schema, queryExamples }
    },
  )

  const generatedQuery = await logger.trace('Write Query', async () => {
    const generatedQuery = await generateText({
      model: languageModel,
      messages: templatePromptWriteQuery({
        schema: relevantDocuments.schema,
        queryExamples: relevantDocuments.queryExamples,
        question,
      }),
    })

    logger.warn('Generated Query', { generatedQuery })

    return logger.trace('Query Enhancement with Proper Nouns', async () => {
      const generatedEnhancedQuery = await generateText({
        model: languageModel,
        tools: {
          searchProperNouns: SearchProperNounsTool({
            namespace,
            sourceId,
          }),
        },
        stopWhen: stepCountIs(50),
        experimental_output: Output.object({
          schema: z.object({
            query: z.string().describe('Query to get the data.'),
            properNouns: z
              .string()
              .describe('Proper nouns replaced in the query.'),
          }),
        }),
        messages: templatePromptQueryEnhancementWithProperNouns({
          query: generatedQuery.text,
        }),
      })

      logger.warn('Generated Enhanced Query', { generatedEnhancedQuery })

      return generatedEnhancedQuery.experimental_output
    })
  })

  logger.warn('Generated Query', generatedQuery)

  const content = await logger.trace('Execute Query', async () => {
    const { result } = await python.executeQueryTool({
      query: generatedQuery.query,
      source_id: sourceId,
      table_names: relevantDocuments.tables,
    })

    logger.warn('Result', { result })

    return result
  })

  return content
}

export async function retrieveStructuredSourceProperNouns({
  namespace,
  sourceId,
  tableName,
  columnName,
  search,
}: {
  namespace: string
  sourceId: string
  tableName: string
  columnName: string
  search: string
}) {
  const key = `"${tableName}"."${columnName}"`

  const relevantProperNouns = await vectorStoreQuery({
    namespace,
    collection: 'proper-nouns',
    sourceId,
    query: search,
    filter: `key = '${key}'`,
    topK: 10,
  })

  logger.warn('Retrieved Relevant Proper Nouns', {
    documents: relevantProperNouns,
  })

  const properNouns = relevantProperNouns.map((p) => p.data.content)

  return properNouns
}
