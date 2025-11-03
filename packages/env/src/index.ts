import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

const env = createEnv({
  server: {
    LOGGER: z.enum(['debug']).optional(),
    APP_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    APP_SECRET_KEY: z.string(),
    API_URL: z.url(),
    WEB_URL: z.url(),
    STORAGE_URL: z.url(),
  },
  runtimeEnv: {
    LOGGER: process.env.LOGGER,
    APP_ENV: process.env.APP_ENV,
    APP_SECRET_KEY: process.env.APP_SECRET_KEY,
    API_URL: process.env.API_URL,
    WEB_URL: process.env.WEB_URL,
    STORAGE_URL: process.env.STORAGE_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})

export { env, createEnv, z }
