import { python } from '@trigger.dev/python'
import { pyArgs, pyPath, pyStreamingResult } from './utils'

type MainArgs = {
  name: string
}

type MainResult = string

export async function main(args: MainArgs): Promise<MainResult> {
  const streamingResult = python.stream.runScript(pyPath('main'), pyArgs(args))

  const result = await pyStreamingResult<MainResult>(streamingResult)

  return result
}
