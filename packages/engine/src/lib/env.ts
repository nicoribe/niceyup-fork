import { env as aiEnv } from '@workspace/ai/env'
import { env as databaseEnv } from '@workspace/db/env'
import { createEnv, z } from '@workspace/env'
import { env as storageEnv } from '@workspace/storage/env'
import { env as vectorStoreEnv } from '@workspace/vector-store/env'

export const env = createEnv({
  extends: [aiEnv, databaseEnv, storageEnv, vectorStoreEnv],
  server: {
    TRIGGER_API_URL: z.string().url().optional(),
    TRIGGER_PROJECT_REF: z.string(),
    TRIGGER_SECRET_KEY: z.string(),
  },
  runtimeEnv: {
    TRIGGER_API_URL: process.env.TRIGGER_API_URL,
    TRIGGER_PROJECT_REF: process.env.TRIGGER_PROJECT_REF,
    TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
