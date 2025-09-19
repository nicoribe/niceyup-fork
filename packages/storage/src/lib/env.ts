import { createEnv, z } from '@workspace/env'

export const env = createEnv({
  server: {
    S3_DEFAULT_BUCKET: z.string(),
    S3_ENGINE_BUCKET: z.string(),
    S3_REGION: z.string().optional(),
    S3_ENDPOINT: z.string().optional(),
    S3_ACCOUNT_ID: z.string().optional(),
    S3_ACCESS_KEY: z.string(),
    S3_SECRET_KEY: z.string(),
  },
  runtimeEnv: {
    S3_DEFAULT_BUCKET: process.env.S3_DEFAULT_BUCKET,
    S3_ENGINE_BUCKET: process.env.S3_ENGINE_BUCKET,
    S3_REGION: process.env.S3_REGION,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_ACCOUNT_ID: process.env.S3_ACCOUNT_ID,
    S3_ACCESS_KEY: process.env.S3_ACCESS_KEY,
    S3_SECRET_KEY: process.env.S3_SECRET_KEY,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
