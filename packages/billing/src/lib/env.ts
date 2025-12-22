import { env as baseEnv, createEnv, z } from '@workspace/env'

export const env = createEnv({
  extends: [baseEnv],
  server: {
    POLAR_ENVIRONMENT: z.enum(['sandbox', 'production']),
    POLAR_ACCESS_TOKEN: z.string(),
    POLAR_WEBHOOK_SECRET: z.string(),
    POLAR_STANDARD_PLAN_PRODUCT_ID: z.string(),
  },
  runtimeEnv: {
    POLAR_ENVIRONMENT: process.env.POLAR_ENVIRONMENT,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    POLAR_STANDARD_PLAN_PRODUCT_ID: process.env.POLAR_STANDARD_PLAN_PRODUCT_ID,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
