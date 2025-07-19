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

export const getDbSchemaTask = schemaTask({
  id: 'get-db-schema',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const result = await python.getDbSchema(
      { dialect },
      {
        envVars: {
          host,
          port,
          user,
          password,
          database,
          // schema: 'public',
          // file_path:`/workspace/${workspaceId}/sources/${sourceId}/uploads/${fileName}.sqlite`
        },
      },
    )

    return result
  },
})
