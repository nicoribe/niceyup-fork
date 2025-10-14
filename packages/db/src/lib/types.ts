import type {
  AIMessageMetadata,
  AIMessagePart,
  AIMessageRole,
  AIMessageStatus,
} from '@workspace/ai/types'

export type SourceType = 'text' | 'structured'

export type DatabaseDialect = 'postgresql' | 'mysql' | 'sqlite'

export type DatabaseConnection = {
  host?: string
  port?: string
  user?: string
  password?: string
  database?: string
  schema?: string // for PostgreSQL
  filePath?: string // for SQLite
}

export type TableMetadata = {
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

export type QueryExample = {
  input: string
  query: string
}

export type PromptMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type MessageStatus = AIMessageStatus

export type MessageRole = AIMessageRole

export type MessagePart = AIMessagePart

export type MessageMetadata = AIMessageMetadata

export type FileBucket = 'default' | 'engine'

export type FileScope = 'public' | 'conversations' | 'sources'

export type FileMetadata = {
  authorId?: string
  conversationId?: string | null
  sourceId?: string
}

export type ConversationExplorerType = 'private' | 'shared' | 'team'
