import type { FastifyRedis } from '@fastify/redis'
import type { WebSocket } from '@fastify/websocket'
import type { Redis } from '@workspace/cache'
import { handleMessageSocket, socketsByChannel } from '../socket-manager'

let publisher: Redis
let subscriber: Redis

export function startPubSubManager({ redis }: { redis: FastifyRedis }) {
  if (!publisher) {
    publisher = redis
  }

  if (!subscriber) {
    subscriber = redis.duplicate()
    subscriber.on('message', handleMessageSocket)
  }
}

export class PubSubManager<Channel extends string> {
  subscribeToChannel({
    channel,
    socket,
  }: { channel: Channel; socket: WebSocket }) {
    if (!socketsByChannel.has(channel)) {
      socketsByChannel.set(channel, new Set())
      subscriber.subscribe(channel)
    }

    const sockets = socketsByChannel.get(channel)!
    sockets.add(socket)

    socket.on('close', () => {
      sockets.delete(socket)
      if (!sockets.size) {
        socketsByChannel.delete(channel)
        subscriber.unsubscribe(channel)
      }
    })
  }

  publishToChannel({
    channel,
    message,
  }: { channel: Channel; message: string }) {
    publisher.publish(channel, message)
  }
}
