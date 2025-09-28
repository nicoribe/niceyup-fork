import { createEnv, z } from '@workspace/env'

export const env = createEnv({
  server: {
    REDIS_HOST: z.string(),
    REDIS_PORT: z.coerce.number(),
  },
  runtimeEnv: {
    REDIS_HOST: process.env.REDIS_HOST,
    REDIS_PORT: process.env.REDIS_PORT,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
