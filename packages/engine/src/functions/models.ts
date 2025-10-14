import { openai } from '@workspace/ai/providers'

// TODO: Make these configurable

export const languageModel = openai.languageModel('gpt-5')
export const embeddingModel = openai.embedding('text-embedding-3-small')
