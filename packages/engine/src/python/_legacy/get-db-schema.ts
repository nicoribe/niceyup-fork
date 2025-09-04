import { python } from '@trigger.dev/python'
import { env } from '@workspace/env'
import type { TableMetadata } from '../../lib/types'
import { pyArgs, pyPath, pyStreamingResult } from '../utils'

type GetDbSchemaArgs = {
  dialect?: string
  file_path?: string
}

type GetDbSchemaEnvVars = {
  host?: string
  port?: string
  user?: string
  password?: string
  database?: string
  schema?: string
}

type GetDbSchemaResult = {
  tables_metadata: TableMetadata[]
}

export async function getDbSchema(
  args: GetDbSchemaArgs,
  { envVars }: { envVars?: GetDbSchemaEnvVars } = {},
): Promise<GetDbSchemaResult> {
  const streamingResult = python.stream.runScript(
    pyPath('get_db_schema'),
    pyArgs(args),
    {
      env: {
        PYTHON_ENV: env.NODE_ENV,
        DATABASE_CLIENT_HOST: envVars?.host,
        DATABASE_CLIENT_PORT: envVars?.port,
        DATABASE_CLIENT_USER: envVars?.user,
        DATABASE_CLIENT_PASSWORD: envVars?.password,
        DATABASE_CLIENT_DATABASE: envVars?.database,
        DATABASE_CLIENT_SCHEMA: envVars?.schema,
      },
    },
  )

  const result = await pyStreamingResult<GetDbSchemaResult>(streamingResult)

  return result
}
