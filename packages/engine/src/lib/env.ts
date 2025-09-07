import { env as aiEnv } from '@workspace/ai/env'
import { env as databaseEnv } from '@workspace/db/env'
import { createEnv, z } from '@workspace/env'

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

const cloudflareEnv = createEnv({
  server: {
    CLOUDFLARE_BUCKET: z.string(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_ACCESS_KEY: z.string(),
    CLOUDFLARE_SECRET_KEY: z.string(),
  },
  runtimeEnv: {
    CLOUDFLARE_BUCKET: process.env.CLOUDFLARE_BUCKET,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY: process.env.CLOUDFLARE_ACCESS_KEY,
    CLOUDFLARE_SECRET_KEY: process.env.CLOUDFLARE_SECRET_KEY,
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
  extends: [triggerEnv, cloudflareEnv, upstashEnv, aiEnv, databaseEnv],
  runtimeEnv: {},
})
