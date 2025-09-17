import { env as aiEnv } from '@workspace/ai/env'
import { env as databaseEnv } from '@workspace/db/env'
import { createEnv, z } from '@workspace/env'
import { env as storageEnv } from '@workspace/storage/env'

export const triggerEnv = createEnv({
  server: {
    TRIGGER_DEV_PROJECT_ID: z.string(),
    TRIGGER_SECRET_KEY: z.string(),
  },
  runtimeEnv: {
    TRIGGER_DEV_PROJECT_ID: process.env.TRIGGER_DEV_PROJECT_ID,
    TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
  },
})

const upstashEnv = createEnv({
  server: {
    UPSTASH_VECTOR_REST_URL: z.string(),
    UPSTASH_VECTOR_REST_TOKEN: z.string(),
  },
  runtimeEnv: {
    UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
    UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,
  },
})

export const env = createEnv({
  extends: [triggerEnv, upstashEnv, aiEnv, databaseEnv, storageEnv],
  runtimeEnv: {},
})
