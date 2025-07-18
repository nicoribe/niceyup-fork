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

export const getDbSchema = schemaTask({
  id: 'get-db-schema',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const tables_metadata = await python.getDbSchema(
      { dialect },
      { envVars: { host, port, user, password, database } },
    )

    return { tables_metadata }
  },
})
