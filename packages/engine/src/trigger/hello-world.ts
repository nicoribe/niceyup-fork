import { python } from '@trigger.dev/python'
import { logger, task } from '@trigger.dev/sdk'

import { scriptArgs, scriptPath } from '../lib/utils'

export const helloWorld = task({
  id: 'hello-world',
  run: async () => {
    const streamingResult = python.stream.runScript(
      scriptPath('main.py'),
      scriptArgs({ name: 'world' }),
    )

    for await (const chunk of streamingResult) {
      console.log(chunk)
    }

    logger.info('nDone!', {
      message: 'Done!',
    })

    return {
      status: 'success',
      message: 'Job completed!',
    }
  },
})
