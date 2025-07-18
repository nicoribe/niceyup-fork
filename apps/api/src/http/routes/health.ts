import type { FastifyTypedInstance } from '@/types/fastify'

export async function healthRoutes(app: FastifyTypedInstance) {
  app.get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
  }))
}
