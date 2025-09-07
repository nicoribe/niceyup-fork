import { defineConfig } from 'drizzle-kit'
import { env } from './src/lib/env'

export default defineConfig({
  dialect: 'postgresql',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  schema: './src/schema/index.ts',
  out: './src/migrations',
})
