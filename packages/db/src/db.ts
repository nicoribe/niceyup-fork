import { env } from '@workspace/env'
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema'

export const db = drizzle(env.DATABASE_URL, {
  logger: env.APP_ENV === 'development',
  schema,
})
