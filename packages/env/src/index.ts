import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    APP_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    ENCRYPTION_KEY: z.string(),
    API_URL: z.string().url(),
    WEB_URL: z.string().url(),
    DATABASE_URL: z.string().url(),

    OPENAI_API_KEY: z.string().optional(),
    AI_GATEWAY_API_KEY: z.string().optional(),

    TRIGGER_DEV_PROJECT_ID: z.string(),
    TRIGGER_SECRET_KEY: z.string(),
    CLOUDFLARE_BUCKET: z.string(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_ACCESS_KEY: z.string(),
    CLOUDFLARE_SECRET_KEY: z.string(),
    UPSTASH_VECTOR_REST_URL: z.string(),
    UPSTASH_VECTOR_REST_TOKEN: z.string(),

    NOVU_SECRET_KEY: z.string().optional(),

    BETTER_AUTH_SECRET: z.string(),
    RESEND_API_KEY: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),

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
  client: {},
  shared: {
    NEXT_PUBLIC_WEB_URL: z.string().url(),
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    APP_ENV: process.env.APP_ENV,

    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    API_URL: process.env.API_URL,
    WEB_URL: process.env.WEB_URL,
    DATABASE_URL: process.env.DATABASE_URL,

    AI_GATEWAY_API_KEY: process.env.AI_GATEWAY_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,

    TRIGGER_DEV_PROJECT_ID: process.env.TRIGGER_DEV_PROJECT_ID,
    TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
    CLOUDFLARE_BUCKET: process.env.CLOUDFLARE_BUCKET,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY: process.env.CLOUDFLARE_ACCESS_KEY,
    CLOUDFLARE_SECRET_KEY: process.env.CLOUDFLARE_SECRET_KEY,
    UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
    UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,

    NOVU_SECRET_KEY: process.env.NOVU_SECRET_KEY,

    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,

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

    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  },
  emptyStringAsUndefined: true,
})
