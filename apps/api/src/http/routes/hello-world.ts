import type { FastifyTypedInstance } from '@/types/fastify'
import { helloWorld as helloWorldTask } from '@workspace/engine/trigger/hello-world'
import z from 'zod'
import { BadRequestError } from '../errors/bad-request-error'

export async function helloWorldRoutes(app: FastifyTypedInstance) {
  app.post(
    '/hello-world',
    {
      schema: {
        body: z.object({
          name: z.string(),
        }),
        response: {
          200: z.object({
            id: z.string(),
          }),
        },
      },
    },
    async (request) => {
      const { name } = request.body

      if (!name) {
        throw new BadRequestError({
          code: 'name-required',
          message: 'Name is required',
        })
      }

      const handle = await helloWorldTask.trigger({
        name,
      })

      return handle
    },
  )
}
