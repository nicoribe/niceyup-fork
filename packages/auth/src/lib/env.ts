import { env as databaseEnv } from '@workspace/db/env'
import { env as emailEnv } from '@workspace/email/env'
import { env as baseEnv, createEnv, z } from '@workspace/env'

const stripeEnv = createEnv({
  server: {
    STRIPE_SECRET_KEY: z.string(),
    STRIPE_WEBHOOK_SECRET: z.string(),
    STRIPE_STANDARD_PLAN_PRICE_ID: z.string().optional(),
    STRIPE_STANDARD_PLAN_ANNUAL_DISCOUNT_PRICE_ID: z.string().optional(),
    STRIPE_STANDARD_PLAN_FREE_TRIAL_DAYS: z.coerce
      .number()
      .optional()
      .default(7),
    STRIPE_PRO_PLAN_PRICE_ID: z.string().optional(),
    STRIPE_PRO_PLAN_ANNUAL_DISCOUNT_PRICE_ID: z.string().optional(),
  },
  runtimeEnv: {
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_STANDARD_PLAN_PRICE_ID: process.env.STRIPE_STANDARD_PLAN_PRICE_ID,
    STRIPE_STANDARD_PLAN_ANNUAL_DISCOUNT_PRICE_ID:
      process.env.STRIPE_STANDARD_PLAN_ANNUAL_DISCOUNT_PRICE_ID,
    STRIPE_STANDARD_PLAN_FREE_TRIAL_DAYS:
      process.env.STRIPE_STANDARD_PLAN_FREE_TRIAL_DAYS,
    STRIPE_PRO_PLAN_PRICE_ID: process.env.STRIPE_PRO_PLAN_PRICE_ID,
    STRIPE_PRO_PLAN_ANNUAL_DISCOUNT_PRICE_ID:
      process.env.STRIPE_PRO_PLAN_ANNUAL_DISCOUNT_PRICE_ID,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})

const oauthEnv = createEnv({
  server: {
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
  },
  runtimeEnv: {
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})

export const env = createEnv({
  extends: [oauthEnv, stripeEnv, baseEnv, databaseEnv, emailEnv],
  server: {
    BETTER_AUTH_SECRET: z.string(),
  },
  runtimeEnv: {
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.CI,
})
