import { del } from './commands/delete'
import { query } from './commands/query'
import { upsert } from './commands/upsert'

export const vectorStore = {
  upsert,
  query,
  delete: del,
}
