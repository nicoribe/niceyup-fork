import { python } from '@trigger.dev/python'
import { env } from '../lib/env'
import { pyArgs, pyPath, pyStreamingResult } from '../lib/python'
import { tmpDir } from '../lib/utils'

type RunDbReplicationArgs = {
  source_id: string
  dialect?: string
  file_path?: string
  tables_metadata?: {
    name: string
    columns: {
      name: string
    }[]
  }[]
}

type RunDbReplicationEnvVars = {
  host?: string
  port?: string
  user?: string
  password?: string
  database?: string
  schema?: string
}

type RunDbReplicationResult = {
  status: 'success' | 'error'
  message: string
}

export async function runDbReplication(
  args: RunDbReplicationArgs,
  { envVars }: { envVars?: RunDbReplicationEnvVars } = {},
): Promise<RunDbReplicationResult> {
  const streamingResult = python.stream.runScript(
    pyPath('run_db_replication'),
    pyArgs(args),
    {
      env: {
        APP_ENV: env.APP_ENV,
        TMP_DIR: tmpDir(),
        DATABASE_CLIENT_HOST: envVars?.host,
        DATABASE_CLIENT_PORT: envVars?.port,
        DATABASE_CLIENT_USER: envVars?.user,
        DATABASE_CLIENT_PASSWORD: envVars?.password,
        DATABASE_CLIENT_DATABASE: envVars?.database,
        DATABASE_CLIENT_SCHEMA: envVars?.schema,
      },
    },
  )

  const result =
    await pyStreamingResult<RunDbReplicationResult>(streamingResult)

  return result
}
