import { python } from '@trigger.dev/python'
import { env } from '../lib/env'
import { pyArgs, pyPath, pyStreamingResult } from '../lib/python'
import { tmpDir } from '../lib/utils'

type GetDbProperNounsArgs = {
  source_id: string
  tables_metadata?: {
    name: string
    columns: {
      name: string
    }[]
  }[]
}

type GetDbProperNounsResult = {
  name: string
  columns: {
    name: string
    proper_nouns: string[]
  }[]
}[]

export async function getDbProperNouns(
  args: GetDbProperNounsArgs,
): Promise<GetDbProperNounsResult> {
  const streamingResult = python.stream.runScript(
    pyPath('get_db_proper_nouns'),
    pyArgs(args),
    {
      env: {
        APP_ENV: env.APP_ENV,
        TMP_DIR: tmpDir(),
      },
    },
  )

  const result =
    await pyStreamingResult<GetDbProperNounsResult>(streamingResult)

  return result
}
