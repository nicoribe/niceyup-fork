import { python } from '@trigger.dev/python'
import { env } from '../../lib/env'
import { pyArgs, pyPath, pyStreamingResult } from '../../lib/python'
import { tmpDir } from '../../lib/utils'

type ExecuteQueryToolArgs = {
  source_id: string
  query: string
  table_names?: string[]
}

type ExecuteQueryToolResult = {
  result: string
}

export async function executeQueryTool(
  args: ExecuteQueryToolArgs,
): Promise<ExecuteQueryToolResult> {
  const streamingResult = python.stream.runScript(
    pyPath('execute_query_tool'),
    pyArgs(args),
    {
      env: {
        APP_ENV: env.APP_ENV,
        TMP_DIR: tmpDir(),
      },
    },
  )

  const result =
    await pyStreamingResult<ExecuteQueryToolResult>(streamingResult)

  return result
}
