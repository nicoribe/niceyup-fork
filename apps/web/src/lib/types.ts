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

export type MessageStatus =
  | 'queued'
  | 'in_progress'
  | 'finished'
  | 'stopped'
  | 'failed'

export type PromptInputStatus = 'submitted' | 'streaming' | 'ready' | 'error'

export type MessageRole = 'system' | 'user' | 'assistant'

export type MessageTextPart = { type: 'text'; text: string }

export type MessageFilePart = {
  type: 'file'
  mediaType: string
  filename?: string
  url: string
}

export type MessagePart = MessageTextPart | MessageFilePart

export type MessageContent = string | MessagePart[]

export type MessageMetadata = { [key: string]: any }

export type Message = {
  id: string
  status: MessageStatus
  role: MessageRole
  content: MessageContent
  metadata?: MessageMetadata
  parent_id?: string | null
  children?: string[]
  created_at?: Date
}
