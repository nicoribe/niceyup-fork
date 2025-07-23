export type ColumnMetadata = {
  name: string
  data_type: string
  foreign_table?: string
  foreign_column?: string
}

export type TableMetadata = {
  name: string
  columns: ColumnMetadata[]
}
