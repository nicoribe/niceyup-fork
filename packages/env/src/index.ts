import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

const env = createEnv({
  server: {
    LOGGER: z.enum(['debug']).optional(),
    APP_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    API_URL: z.string().url(),
    API_KEY: z.string(),
    WEB_URL: z.string().url(),
    STORAGE_URL: z.string().url(),
  },
  runtimeEnv: {
    LOGGER: process.env.LOGGER,
    APP_ENV: process.env.APP_ENV,
    API_URL: process.env.API_URL,
    API_KEY: process.env.API_KEY,
    WEB_URL: process.env.WEB_URL,
    STORAGE_URL: process.env.STORAGE_URL,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})

export { env, createEnv, z }
