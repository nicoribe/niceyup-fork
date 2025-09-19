import { createEnv, z } from '@workspace/env'

export const env = createEnv({
  server: {
    ENCRYPTION_KEY: z.string(),
  },
  runtimeEnv: {
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
