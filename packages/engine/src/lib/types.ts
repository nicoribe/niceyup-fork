export type TableMetadata = {
  table_name: string
  column_name: string
  data_type: string
  foreign_table: string | null
  foreign_column: string | null
}
