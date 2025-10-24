import type {
  AIMessage,
  AIMessageMetadata,
  AIMessagePart,
} from '@workspace/ai/types'

export type AIMessageNode = Omit<AIMessage, 'parts' | 'metadata'> & {
  parts: AIMessagePart[] | null
  metadata: AIMessageMetadata | null
  parentId?: string | null
  children?: string[]
}
