import { randomUUID } from 'node:crypto'
import { text, timestamp } from 'drizzle-orm/pg-core'

export const generateId = (): string => randomUUID()

export const id = {
  id: text('id').primaryKey().$defaultFn(generateId),
}

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
}
