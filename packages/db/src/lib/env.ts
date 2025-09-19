import { env as encryptionEnv } from '@workspace/encryption/env'
import { env as baseEnv, createEnv, z } from '@workspace/env'

export const env = createEnv({
  extends: [baseEnv, encryptionEnv],
  server: {
    DATABASE_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
