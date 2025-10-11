import * as agents from './agents'
import * as conversations from './conversations'
import * as databaseConnections from './databaseConnections'
import * as files from './files'
import * as messages from './messages'
import * as organizations from './organizations'
import * as sources from './sources'
import * as structured from './structured'

export const contextQueries = {
  ...organizations,
  ...sources,
  ...databaseConnections,
  ...structured,
  ...agents,
  ...conversations,
  ...messages,
  ...files,
}
