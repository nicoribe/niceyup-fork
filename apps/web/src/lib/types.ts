import type {
  AIMessageMetadata,
  AIMessagePart,
  AIMessageRole,
  AIMessageStatus,
} from '@workspace/ai/types'

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
  metadata?: unknown
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
  teamId: string | null
  ownerId: string | null
  agentId: string | null
}

export type PromptInputStatus = 'submitted' | 'streaming' | 'ready' | 'error'

export type MessageStatus = AIMessageStatus

export type MessageRole = AIMessageRole

export type MessagePart = AIMessagePart

export type MessageMetadata = AIMessageMetadata

export type Message = {
  id: string
  status: MessageStatus
  role: MessageRole
  parts: MessagePart[] | null
  metadata?: MessageMetadata | null
  authorId?: string | null
  parentId?: string | null
  children?: string[]
}

export type MessageRealtimeRun = NonNullable<AIMessageMetadata['realtimeRun']>

export type PromptMessagePart =
  | {
      type: 'text'
      text: string
    }
  | {
      type: 'file'
      mediaType: string
      filename?: string
      url: string
    }
