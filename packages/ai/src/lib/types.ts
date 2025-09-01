import type { UIDataTypes, UIMessage, UIMessagePart, UITools } from 'ai'

export type AIMessageMetadata = {
  realtimeRun?: {
    messageId: string
    id: string
    publicAccessToken: string
  }
  error?: any
}

export type AIMessageStatus =
  | 'queued'
  | 'in_progress'
  | 'finished'
  | 'stopped'
  | 'failed'

export type AIMessage<
  METADATA = AIMessageMetadata,
  DATA_PARTS extends UIDataTypes = UIDataTypes,
  TOOLS extends UITools = UITools,
> = UIMessage<METADATA, DATA_PARTS, TOOLS> & {
  status: AIMessageStatus
}

export type AIMessagePart<
  DATA_TYPES extends UIDataTypes,
  TOOLS extends UITools,
> = UIMessagePart<DATA_TYPES, TOOLS>
