import { withDefaultErrorResponses } from '@/http/errors/default-error-responses'
import type { FastifyTypedInstance } from '@/types/fastify'
import { z } from 'zod'

export async function health(app: FastifyTypedInstance) {
  app.get(
    '/health',
    {
      schema: {
        tags: ['Default'],
        description: 'Check if the API is working',
        operationId: 'health',
        security: [],
        response: withDefaultErrorResponses({
          200: z
            .object({
              status: z.string(),
              timestamp: z.string(),
              uptime: z.number(),
              memoryUsage: z.object({
                rss: z.number(),
                heapTotal: z.number(),
                heapUsed: z.number(),
              }),
            })
            .describe('Success'),
        }),
      },
    },
    async () => {
      return {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
      }
    },
  )
}
