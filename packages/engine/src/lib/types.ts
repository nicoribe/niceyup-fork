export type SourceType =
  | 'text'
  | 'question-answer'
  | 'website'
  | 'file'
  | 'database'

export type DatabaseSourceColumnMetadata = {
  name: string
  meta?: {
    description?: string
    properNoun?: boolean
  }
  data_type: string
  foreign_table?: string
  foreign_column?: string
}

export type DatabaseSourceTableMetadata = {
  name: string
  meta?: {
    description?: string
  }
  columns: DatabaseSourceColumnMetadata[]
}

export type DatabaseSourceQueryExample = {
  input: string
  query: string
}

export type SingleOrMultiple<T> = T | T[]
