import { openai } from '@workspace/ai/providers'

// TODO: Make this dynamic based on the agent's configuration
export const languageModel = openai.languageModel('gpt-5')
