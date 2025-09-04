import { logger, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { python } from '../../python'

const { workspaceId, sourceId } = {
  workspaceId: 'xxxx-xxxx-xxxx-xxxx',
  sourceId: 'xxxx-xxxx-xxxx-xxxx',
}

const { dialect, host, port, user, password, database } = {
  dialect: 'mysql',
  host: 'localhost',
  port: '3306',
  user: 'mysql',
  password: 'supersecret',
  database: 'default',
}

const tablesMetadata = [
  {
    name: 'users',
    columns: [{ name: 'id' }, { name: 'username' }],
  },
]

export const replicateDbTask = schemaTask({
  id: 'replicate-db',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const result = await python.replicateDb(
      {
        workspace_id: workspaceId,
        source_id: sourceId,
        dialect,
        tables_metadata: tablesMetadata,
      },
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
