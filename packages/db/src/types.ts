export type PromptMessages = {
  role: 'user' | 'assistant'
  content: string
}[]

export type TablesMetadata = {
  name: string
  columns: {
    name: string
    data_type: string
    foreign_table?: string
    foreign_column?: string
  }[]
}[]

export type TablesInfo = {
  name: string
  description?: string
  columns: {
    name: string
    description?: string
    data_type: string
    foreign_table?: string
    foreign_column?: string
  }[]
}[]

export type ColumnsProperNamesByTables = {
  name: string
  columns: { name: string }[]
}[]

export type QueryExamples = {
  input: string
  query: string
}[]
