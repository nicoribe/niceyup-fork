import { Index } from '@upstash/vector'
import { env } from './lib/env'

const index = new Index({
  url: env.UPSTASH_VECTOR_REST_URL,
  token: env.UPSTASH_VECTOR_REST_TOKEN,
})

export async function del(key: string) {
  return index.delete(key)
}

export async function bulkDelete(keys: string[]) {
  return index.delete(keys)
}

export const vectorStore = {
  delete: del,
  bulkDelete,
}
