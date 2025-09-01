import type { AIMessage, AIMessageMetadata } from '@workspace/ai/types'

export type OrganizationTeamParams = {
  organizationSlug: 'my-account' | '$id'
  teamId: '~' | '$id'
}

export type ChatParams = {
  chatId: 'new' | '$id'
}

export type Organization = {
  id: string
  slug: string
  name: string
  logo?: string | null | undefined
  metadata?: any
}

export type Team = {
  id: string
  name: string
  organizationId: string
}

export type Agent = {
  id: string
  name: string
}

export type ConversationExplorerType = 'private' | 'shared' | 'team'

export type Chat = {
  id: string
  title: string
  agentId: string | null
}

export type PromptInputStatus = 'submitted' | 'streaming' | 'ready' | 'error'

export type MessageStatus = AIMessage['status']

export type MessageRole = AIMessage['role']

export type MessagePart = AIMessage['parts'][number]

export type MessageMetadata = AIMessage['metadata']

export type Message = {
  id: string
  status: MessageStatus
  role: MessageRole
  parts: MessagePart[] | null
  metadata?: MessageMetadata | null
  parentId?: string | null
  children?: string[]
}

export type MessageRealtimeRun = NonNullable<AIMessageMetadata['realtimeRun']>
