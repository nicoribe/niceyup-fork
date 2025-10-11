import { logger } from '@trigger.dev/sdk'
import { python } from '../python'

export async function findRelevantContent(question: string): Promise<string> {
  logger.warn('Question', { question })

  const document = await logger.trace('Retrieve Document', async () => {
    // TODO: Implement logic to retrieve document

    return {
      sourceId: '6da7603f-a3a7-443d-9286-c26a0ac956d7',
      sourceType: 'structured',
    }
  })

  if (document.sourceType === 'structured') {
    const relevantDocuments = await logger.trace(
      'Retrieve Relevant Documents',
      async () => {
        // TODO: Implement logic to retrieve relevant documents

        return {
          tables: ['users'],
          schema: 'CREATE TABLE users (id INT, email VARCHAR(255))',
          queryExamples:
            'Input: `What are the names and emails of the registered users?`\nQuery: `SELECT * FROM users`',
        }
      },
    )

    const query = await logger.trace('Write Query', async () => {
      // TODO: Implement logic to write query

      const properNouns = await logger.trace(
        'Search Proper Nouns Query',
        async () => {
          // TODO: Implement logic to search proper nouns

          return await python.getDbProperNouns({
            source_id: document.sourceId,
            tables_metadata: [{ name: 'users', columns: [{ name: 'email' }] }],
          })
        },
      )

      logger.warn('Proper Nouns', { properNouns })

      return 'SELECT * FROM users'
    })

    return await logger.trace('Execute Query', async () => {
      // TODO: Implement logic to execute query

      const { result } = await python.executeQueryTool({
        query,
        source_id: document.sourceId,
        table_names: relevantDocuments.tables,
      })

      return result
    })
  }

  return 'Empty'
}
