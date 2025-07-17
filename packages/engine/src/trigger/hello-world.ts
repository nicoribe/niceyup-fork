import { python } from '@trigger.dev/python'
import { task } from '@trigger.dev/sdk'

import { parsePyLogger, pyArgs, pyPath } from '../lib/utils'

export const helloWorld = task({
  id: 'hello-world',
  run: async () => {
    const streamingResult = python.stream.runScript(
      pyPath('main.py'),
      pyArgs({ name: 'world' }),
    )

    for await (const chunk of streamingResult) {
      parsePyLogger(chunk)
    }

    return {
      status: 'success',
      message: 'Job completed!',
    }
  },
})
