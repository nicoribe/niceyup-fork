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

  const sources = []

  const uniqueDatabaseSources = new Map<string, (typeof documents)[number]>()

  for (const source of documents) {
    if (source.sourceType === 'database') {
      if (!uniqueDatabaseSources.has(source.sourceId)) {
        uniqueDatabaseSources.set(source.sourceId, source)
      }
    } else {
      sources.push(source)
    }
  }

  const databaseSources = Array.from(uniqueDatabaseSources.values())

  const databaseSourcesContent = await Promise.all(
    databaseSources.map(async (source) => {
      const structuredContent = await retrieveDatabaseSourceTablesMetadata({
        namespace,
        question,
        sourceId: source.sourceId,
      })

      return `<source id="${source.sourceId}" type="database">${structuredContent}</source>`
    }),
  )

  const sourcesContent = sources.map(
    (source) =>
      `<source id="${source.sourceId}" type="${source.sourceType}">${source.data.content}</source>`,
  )

  sourcesContent.push(...databaseSourcesContent)

  logger.warn('Output', { output: { sourcesContent } })

  return sourcesContent
}

export async function retrieveDatabaseSourceTablesMetadata({
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
            collection: 'database-source-tables-metadata',
            sourceId,
            query: question,
            topK: 10,
          }),

          vectorStoreQuery({
            namespace,
            collection: 'database-source-query-examples',
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

      const schema = await logger.trace('Create Schema', async () => {
        const lines = []

        for (const table of tablesMetadata) {
          let tableLine = `CREATE TABLE "${table.name}" (\n`

          const columnsLine = []

          for (const column of table.columns) {
            let referenceLine = ''

            if (column.foreign_table && column.foreign_column) {
              referenceLine = ` REFERENCES "${column.foreign_table}" ("${column.foreign_column}")`
            }

            columnsLine.push(
              `  "${column.name}" ${column.data_type}${referenceLine}`,
            )
          }

          tableLine += `${columnsLine.join(',\n')}\n)\n`

          lines.push(tableLine)
        }

        return lines.join('\n')
      })

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

export async function retrieveDatabaseSourceProperNouns({
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
    collection: 'database-source-proper-nouns',
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
