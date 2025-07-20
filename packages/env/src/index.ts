import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),

    API_URL: z.string().url(),
    WEB_URL: z.string().url(),
    DATABASE_URL: z.string().url(),

    OPENAI_API_KEY: z.string().optional(),
    GOOGLE_GENERATIVE_AI_API_KEY: z.string().optional(),
    GITHUB_CLIENT_ID: z.string().optional(),
    GITHUB_CLIENT_SECRET: z.string().optional(),
    BETTER_AUTH_SECRET: z.string(),
    TRIGGER_DEV_PROJECT_ID: z.string(),
    TRIGGER_SECRET_KEY: z.string(),
    CLOUDFLARE_BUCKET: z.string(),
    CLOUDFLARE_ACCOUNT_ID: z.string(),
    CLOUDFLARE_ACCESS_KEY: z.string(),
    CLOUDFLARE_SECRET_KEY: z.string(),
    UPSTASH_VECTOR_REST_URL: z.string(),
    UPSTASH_VECTOR_REST_TOKEN: z.string(),
  },
  client: {},
  shared: {
    NEXT_PUBLIC_WEB_URL: z.string().url(),
    NEXT_PUBLIC_API_URL: z.string().url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,

    API_URL: process.env.API_URL,
    WEB_URL: process.env.WEB_URL,
    DATABASE_URL: process.env.DATABASE_URL,

    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_GENERATIVE_AI_API_KEY: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    TRIGGER_DEV_PROJECT_ID: process.env.TRIGGER_DEV_PROJECT_ID,
    TRIGGER_SECRET_KEY: process.env.TRIGGER_SECRET_KEY,
    CLOUDFLARE_BUCKET: process.env.CLOUDFLARE_BUCKET,
    CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
    CLOUDFLARE_ACCESS_KEY: process.env.CLOUDFLARE_ACCESS_KEY,
    CLOUDFLARE_SECRET_KEY: process.env.CLOUDFLARE_SECRET_KEY,
    UPSTASH_VECTOR_REST_URL: process.env.UPSTASH_VECTOR_REST_URL,
    UPSTASH_VECTOR_REST_TOKEN: process.env.UPSTASH_VECTOR_REST_TOKEN,

    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WEB_URL: process.env.NEXT_PUBLIC_WEB_URL,
  },
  emptyStringAsUndefined: true,
})
