import { PubSubManager } from './pub-sub-manager'

type ConversationId = string

type Event = 'updated'

type ConversationChannel = `conversations:${ConversationId}:${Event}`

export class ConversationPubSub extends PubSubManager<ConversationChannel> {
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
    messages: any[]
  }) {
    this.publishToChannel({ channel, message: JSON.stringify(messages) })
  }
}

export const conversationPubSub = new ConversationPubSub()
