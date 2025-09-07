import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

const env = createEnv({
  server: {
    APP_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    API_URL: z.string().url(),
    WEB_URL: z.string().url(),
  },
  runtimeEnv: {
    APP_ENV: process.env.APP_ENV,
    API_URL: process.env.API_URL,
    WEB_URL: process.env.WEB_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation:
    !!process.env.CI || process.env.npm_lifecycle_event === 'lint',
})

export { env, createEnv, z }
