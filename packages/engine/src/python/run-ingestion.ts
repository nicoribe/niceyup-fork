import { python } from '@trigger.dev/python'
import { pyArgs, pyPath, pyStreamingResult } from './utils'

type RunIngestionArgs = {
  source_id: string
  workspace_id: string
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
  )

  const result = await pyStreamingResult<{
    message: RunIngestionResult
  }>(streamingResult)

  return result.message
}
