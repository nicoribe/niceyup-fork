import { logger } from '@trigger.dev/sdk'
import { tool } from '@workspace/ai'
import { z } from 'zod'
import { retrieveDatabaseSourceProperNouns, retrieveSources } from './retriever'

export function GetInformationTool({ namespace }: { namespace: string }) {
  return tool({
    description:
      'Get information from your knowledge base to answer questions.',
    inputSchema: z.object({
      question: z.string().describe('The users question.'),
    }),
    execute: async ({ question }) => {
      return logger.trace('Get Information Tool', () => {
        return retrieveSources({ namespace, question })
      })
    },
  })
}

export function SearchProperNounsTool({
  namespace,
  sourceId,
}: { namespace: string; sourceId: string }) {
  return tool({
    description: 'Search for proper nouns in the knowledge base.',
    inputSchema: z.object({
      tableName: z.string().describe('The name of the table.'),
      columnName: z.string().describe('The name of the column.'),
      search: z.string().describe('The search query.'),
    }),
    execute: async ({ tableName, columnName, search }) => {
      return logger.trace('Search Proper Nouns Tool', () => {
        return retrieveDatabaseSourceProperNouns({
          namespace,
          sourceId,
          tableName,
          columnName,
          search,
        })
      })
    },
  })
}
