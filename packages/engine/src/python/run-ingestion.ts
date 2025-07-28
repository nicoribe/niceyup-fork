import { python } from '@trigger.dev/python'
import { env } from '@workspace/env'
import { pyArgs, pyPath, pyStreamingResult } from './utils'

type ColumnInfo = {
  name: string
  description?: string
  data_type: string
  foreign_table?: string
  foreign_column?: string
}

type TableInfo = {
  name: string
  description?: string
  columns: ColumnInfo[]
}

type ColumnInfoWithProperNames = {
  name: string
}

type TableInfoWithColumnProperNames = {
  name: string
  columns: ColumnInfoWithProperNames[]
}

type QueryExample = {
  input: string
  query: string
}

type RunIngestionArgs = {
  workspace_id: string
  source_id: string
  source_type: 'text' | 'pdf' | 'website' | 'question_answer' | 'structured'
  tables_info?: TableInfo[]
  columns_proper_names_by_tables?: TableInfoWithColumnProperNames[]
  query_examples?: QueryExample[]
}

type RunIngestionResult = {
  status: 'success' | 'error'
  message: string
}

export async function runIngestion(
  args: RunIngestionArgs,
): Promise<RunIngestionResult> {
  const streamingResult = python.stream.runScript(
    pyPath('run_ingestion'),
    pyArgs(args),
    {
      env: {
        PYTHON_ENV: env.NODE_ENV,
      },
    },
  )

  const result = await pyStreamingResult<RunIngestionResult>(streamingResult)

  return result
}
