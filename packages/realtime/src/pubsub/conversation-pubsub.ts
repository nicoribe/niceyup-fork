import type { WebSocket } from 'ws'
import { PubSub } from '../lib/pubsub'
import type { AIMessageNode } from '../lib/types'

type ConversationId = string

type Event = 'updated'

type ConversationChannel = `conversations:${ConversationId}:${Event}`

export class ConversationPubSub extends PubSub<ConversationChannel> {
  subscribe({
    channel,
    socket,
  }: {
    channel: ConversationChannel
    socket: WebSocket
  }) {
    this.subscribeToChannel({ channel, socket })
  }

  publish({
    channel,
    messages,
  }: {
    channel: ConversationChannel
    messages: AIMessageNode[]
  }) {
    this.publishToChannel({ channel, message: JSON.stringify(messages) })
  }
}

export const conversationPubSub = new ConversationPubSub()
