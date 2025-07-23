import { python } from '@trigger.dev/python'
import { pyArgs, pyPath, pyStreamingResult } from './utils'

type RunIngestionArgs = {
  workspace_id: string
  source_id: string
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

  const result = await pyStreamingResult<RunIngestionResult>(streamingResult)

  return result
}
