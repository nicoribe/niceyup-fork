import type {
  AIMessageMetadata,
  AIMessagePart,
  AIMessageRole,
  AIMessageStatus,
} from '@workspace/ai/types'

export type SourceType =
  | 'text'
  | 'question-answer'
  | 'website'
  | 'file'
  | 'database'

export type DatabaseSourceDialect = 'postgresql' | 'mysql' | 'sqlite'

export type DatabaseSourceTableMetadata = {
  name: string
  meta?: {
    description?: string
  }
  columns: {
    name: string
    meta?: {
      description?: string
      properNoun?: boolean
    }
    data_type: string
    foreign_table?: string
    foreign_column?: string
  }[]
}

export type DatabaseSourceQueryExample = {
  input: string
  query: string
}

export type ConnectionApp = string // TODO: add type

export type ConnectionPayload = Record<string, any> // TODO: add type

export type MessageStatus = AIMessageStatus

export type MessageRole = AIMessageRole

export type MessagePart = AIMessagePart

export type MessageMetadata = AIMessageMetadata

export type FileBucket = 'default' | 'engine'

export type FileScope = 'public' | 'conversations' | 'sources'

export type FileMetadata = {
  authorId?: string
  // agentIds?: string[]
  // conversationIds?: string[]
  sourceId?: string
}

export type ConversationExplorerNodeVisibility = 'private' | 'shared' | 'team'
