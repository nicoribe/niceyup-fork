import { python } from '@trigger.dev/python'
import { pyArgs, pyPath, pyStreamingResult } from './utils'

type HelloWorldArgs = {
  name: string
}

type HelloWorldResult = string

export async function helloWorld(
  args: HelloWorldArgs,
): Promise<HelloWorldResult> {
  const streamingResult = python.stream.runScript(
    pyPath('hello_world'),
    pyArgs(args),
  )

  const result = await pyStreamingResult<HelloWorldResult>(streamingResult)

  return result
}
