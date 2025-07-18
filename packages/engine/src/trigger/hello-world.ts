import { logger, schemaTask } from '@trigger.dev/sdk'
import { z } from 'zod'
import { python } from '../python'

export const helloWorld = schemaTask({
  id: 'hello-world',
  schema: z.object({
    name: z.string(), // Input: "Davy Jones"
  }),
  run: async (payload) => {
    logger.info('payload', payload)

    const result = await python.helloWorld({ name: payload.name })

    return result // Output: "Hello world, Davy Jones!"
  },
})
