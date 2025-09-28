import type { WebSocket } from '@fastify/websocket'
import type { AIMessage } from '@workspace/ai/types'

export const socketsByChannel = new Map<string, Set<WebSocket>>()

export function handleMessageSocket(channel: string, message: string) {
  const sockets = socketsByChannel.get(channel)
  if (!sockets) {
    return
  }

  for (const socket of sockets) {
    if (socket.readyState === WebSocket.OPEN) {
      sendToSocket({ channel, socket, message })
    }
  }
}

export function sendToSocket({
  channel,
  socket,
  message,
}: { channel: string; socket: WebSocket; message: string }) {
  if (channel.match(/^message:[^:]*:updated$/)) {
    socket.send(message)

    const { status } = JSON.parse(message) as AIMessage
    if (status === 'stopped' || status === 'finished' || status === 'failed') {
      socket.close()
    }
    return
  }

  socket.send(message)
}
