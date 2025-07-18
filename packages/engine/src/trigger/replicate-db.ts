import { logger, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { python } from '../python'

const { dialect, host, port, user, password, database } = {
  dialect: 'mysql',
  host: 'localhost',
  port: '3306',
  user: 'mysql',
  password: 'supersecret',
  database: 'default',
}

const tables_metadata = {
  users: ['id', 'username'],
}

export const replicateDb = schemaTask({
  id: 'replicate-db',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const result = await python.replicateDb(
      { dialect, tables_metadata },
      { envVars: { host, port, user, password, database } },
    )

    return result
  },
})
