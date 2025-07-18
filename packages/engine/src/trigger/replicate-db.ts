import { logger, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { python } from '../python'

const { sourceId, workspaceId } = {
  sourceId: 'xxxx-xxxx-xxxx-xxxx',
  workspaceId: 'xxxx-xxxx-xxxx-xxxx',
}

const { dialect, host, port, user, password, database } = {
  dialect: 'mysql',
  host: 'localhost',
  port: '3306',
  user: 'mysql',
  password: 'supersecret',
  database: 'default',
}

const tablesMetadata = {
  users: [{ columnName: 'id' }, { columnName: 'username' }],
}

export const replicateDb = schemaTask({
  id: 'replicate-db',
  schema: z.object({
    sourceId: z.string(),
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const result = await python.replicateDb(
      {
        source_id: sourceId,
        workspace_id: workspaceId,
        dialect,
        tables_metadata: Object.fromEntries(
          Object.entries(tablesMetadata).map(([key, value]) => [
            key,
            value.map((col) => ({ column_name: col.columnName })),
          ]),
        ),
      },
      {
        envVars: {
          host,
          port,
          user,
          password,
          database,
        },
      },
    )

    return result
  },
})
