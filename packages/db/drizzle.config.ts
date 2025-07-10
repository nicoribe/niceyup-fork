import { env } from '@workspace/env'
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schema: './src/schema/index.ts',
  out: './src/migrations',
})
