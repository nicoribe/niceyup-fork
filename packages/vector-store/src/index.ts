import { Index } from '@upstash/vector'
import { env } from './lib/env'

export const vectorStore = new Index({
  url: env.UPSTASH_VECTOR_REST_URL,
  token: env.UPSTASH_VECTOR_REST_TOKEN,
})
