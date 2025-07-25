import { python } from '@trigger.dev/python'
import { env } from '@workspace/env'
import { pyArgs, pyPath, pyStreamingResult } from './utils'

type ReplicateDbArgs = {
  workspace_id: string
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

type ReplicateDbEnvVars = {
  host?: string
  port?: string
  user?: string
  password?: string
  database?: string
  schema?: string
}

type ReplicateDbResult = {
  status: 'success' | 'error'
  message: string
}

export async function replicateDb(
  args: ReplicateDbArgs,
  { envVars }: { envVars?: ReplicateDbEnvVars } = {},
): Promise<ReplicateDbResult> {
  const streamingResult = python.stream.runScript(
    pyPath('replicate_db'),
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

  const result = await pyStreamingResult<ReplicateDbResult>(streamingResult)

  return result
}
