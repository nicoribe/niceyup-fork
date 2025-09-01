import type { AIMessage } from '@workspace/ai/types'

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
  columns: {
    name: string
    data_type: string
    foreign_table?: string
    foreign_column?: string
  }[]
}

export type TableInfo = {
  name: string
  description?: string
  columns: {
    name: string
    description?: string
    data_type: string
    foreign_table?: string
    foreign_column?: string
  }[]
}

export type ColumnProperNamesByTables = {
  name: string
  columns: { name: string }[]
}

export type QueryExample = {
  input: string
  query: string
}

export type PromptMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type MessageStatus = AIMessage['status']

export type MessageRole = AIMessage['role']

export type MessagePart = AIMessage['parts'][number]

export type MessageMetadata = AIMessage['metadata']

export type ConversationExplorerType = 'private' | 'shared' | 'team'
