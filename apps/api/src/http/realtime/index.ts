import type { FastifyInstance } from 'fastify'
import { startPubSubManager } from './pub-sub-manager'

export function fastifyRealtime(app: FastifyInstance) {
  app.ready().then(() => startPubSubManager({ redis: app.redis }))
}
