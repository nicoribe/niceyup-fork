import { logger } from '@trigger.dev/sdk'
import { generateText } from '@workspace/ai'
import type { QueryExample, TableMetadata } from '../lib/types'
import { getDbProperNounsTask } from '../trigger/get-db-proper-nouns'
import { languageModel } from './models'
import { experimental_templatePromptSummarizeStructuredSource } from './prompts'
import { vectorStoreUpsert } from './vector-store'

export async function ingestStructuredSource({
  namespace,
  sourceId,
  tablesMetadata,
}: {
  namespace: string
  sourceId: string
  tablesMetadata: TableMetadata[]
}) {
  const documents = []

  for (const table of tablesMetadata) {
    let content = table.name

    if (table.meta?.description) {
      content += `\n${table.meta.description}`
    }

    content += '\n'

    for (const column of table.columns) {
      content += `-\n${column.name}`

      if (column.meta?.description) {
        content += `\n${column.meta.description}`
      }

      content += '\n'
    }

    documents.push({
      content,
    })
  }

  logger.warn('Documents', { documents })

  await vectorStoreUpsert({
    namespace,
    collection: 'sources',
    sourceId,
    sourceType: 'structured',
    data: documents,
  })
}

export async function ingestStructuredSourceTablesMetadata({
  namespace,
  sourceId,
  tablesMetadata,
}: {
  namespace: string
  sourceId: string
  tablesMetadata: TableMetadata[]
}) {
  const documents = []

  for (const table of tablesMetadata) {
    let content = `Table: "${table.name}"\n`

    if (table.meta?.description) {
      content += `Description: ${table.meta.description}\n`
    }

    content += 'Columns:\n'

    for (const column of table.columns) {
      content += `-\n"${column.name}"`

      if (column.foreign_table && column.foreign_column) {
        content += ` relations "${column.foreign_table}"."${column.foreign_column}"`
      }

      if (column.meta?.description) {
        content += `\nDescription: ${column.meta.description}`
      }

      content += '\n'
    }

    documents.push({
      content,
      metadata: {
        tableMetadata: table,
      },
    })
  }

  logger.warn('Documents', { documents })

  await vectorStoreUpsert({
    namespace,
    collection: 'tables-metadata',
    sourceId,
    sourceType: 'structured',
    data: documents,
  })
}

export async function ingestStructuredSourceProperNouns({
  namespace,
  sourceId,
}: {
  namespace: string
  sourceId: string
}) {
  const properNouns = await getDbProperNounsTask
    .triggerAndWait({ sourceId })
    .unwrap()

  logger.warn('Proper Nouns', { properNouns })

  const documents = []

  for (const table of properNouns) {
    for (const column of table.columns) {
      for (const properNoun of column.proper_nouns) {
        documents.push({
          content: properNoun,
          metadata: {
            key: `"${table.name}"."${column.name}"`,
          },
        })
      }
    }
  }

  logger.warn('Documents', { documents })

  await vectorStoreUpsert({
    namespace,
    collection: 'proper-nouns',
    sourceId,
    sourceType: 'structured',
    data: documents,
  })
}

export async function ingestStructuredSourceQueryExamples({
  namespace,
  sourceId,
  queryExamples,
}: {
  namespace: string
  sourceId: string
  queryExamples: QueryExample[]
}) {
  const documents = []

  if (queryExamples) {
    for (const queryExample of queryExamples) {
      const content = `Input: \`${queryExample.input}\`\nQuery: \`${queryExample.query}\``

      documents.push({
        content,
      })
    }
  }

  logger.warn('Documents', { documents })

  await vectorStoreUpsert({
    namespace,
    collection: 'query-examples',
    sourceId,
    sourceType: 'structured',
    data: documents,
  })
}

/**
 * Experimental. Do not use this function in production. Use {@link ingestStructuredSource} instead.
 */
export async function experimental_ingestStructuredSource({
  namespace,
  sourceId,
  tablesMetadata,
}: {
  namespace: string
  sourceId: string
  tablesMetadata: TableMetadata[]
}) {
  const tablesContent = []

  for (const table of tablesMetadata) {
    let content = table.name

    if (table.meta?.description) {
      content += `\n${table.meta.description}`
    }

    content += '\n'

    for (const column of table.columns) {
      content += `-\n${column.name}`

      if (column.meta?.description) {
        content += `\n${column.meta.description}`
      }

      content += '\n'
    }

    tablesContent.push(content)
  }

  const generatedContent = await generateText({
    model: languageModel,
    messages: experimental_templatePromptSummarizeStructuredSource({
      content: tablesContent.join('\n-\n'),
    }),
  })

  const document = {
    content: generatedContent.text,
  }

  logger.warn('Document', { document })

  await vectorStoreUpsert({
    namespace,
    collection: 'sources',
    sourceId,
    sourceType: 'structured',
    data: document,
  })
}
