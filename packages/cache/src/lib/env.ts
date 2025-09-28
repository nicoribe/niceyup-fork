import { createEnv, z } from '@workspace/env'

export const env = createEnv({
  server: {
    REDIS_URL: z.string().url(),
  },
  runtimeEnv: {
    REDIS_URL: process.env.REDIS_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
