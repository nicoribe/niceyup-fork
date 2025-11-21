import { python } from '@trigger.dev/python'
import { env } from '../../lib/env'
import { pyArgs, pyPath, pyStreamingResult } from '../../lib/python'
import { tmpDir } from '../../lib/utils'

type ExecuteQueryDbArgs = {
  source_id: string
  query: string
  table_names?: string[]
}

type ExecuteQueryDbResult = {
  result: string
}

export async function executeQueryDb(
  args: ExecuteQueryDbArgs,
): Promise<ExecuteQueryDbResult> {
  const streamingResult = python.stream.runScript(
    pyPath('execute_query_db'),
    pyArgs(args),
    {
      env: {
        APP_ENV: env.APP_ENV,
        TMP_DIR: tmpDir(),
      },
    },
  )

  const result = await pyStreamingResult<ExecuteQueryDbResult>(streamingResult)

  return result
}
