export type SourceType = 'text' | 'structured'

export type ColumnMetadata = {
  name: string
  meta?: {
    description?: string
    properNoun?: boolean
  }
  data_type: string
  foreign_table?: string
  foreign_column?: string
}

export type TableMetadata = {
  name: string
  meta?: {
    description?: string
  }
  columns: ColumnMetadata[]
}

export type QueryExample = {
  input: string
  query: string
}

export type SingleOrMultiple<T> = T | T[]
