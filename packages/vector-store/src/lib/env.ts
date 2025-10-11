import { createEnv, z } from '@workspace/env'

export const env = createEnv({
  server: {
    UPSTASH_VECTOR_REST_URL: z.string(),
    UPSTASH_VECTOR_REST_TOKEN: z.string(),
  },
  runtimeEnv: {
    UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
    UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
