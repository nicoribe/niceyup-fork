import { contextQueries } from './context'
import * as conversations from './conversations'
import * as files from './files'
import * as messages from './messages'
import * as organizations from './organizations'

export const queries = {
  ...organizations,
  ...conversations,
  ...messages,
  ...files,
  context: contextQueries,
}
