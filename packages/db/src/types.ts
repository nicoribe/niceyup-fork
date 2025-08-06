export type PromptMessage = {
  role: 'user' | 'assistant'
  content: string
}

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
