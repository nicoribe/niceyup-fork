import { drizzle } from 'drizzle-orm/node-postgres'
import { env } from './lib/env'
import * as schema from './schema'

export const db = drizzle(env.DATABASE_URL, {
  logger: env.LOGGER === 'debug',
  schema,
})

export type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0]
