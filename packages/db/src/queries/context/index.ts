import * as agents from './agents'
import * as connections from './connections'
import * as conversations from './conversations'
import * as files from './files'
import * as messages from './messages'
import * as organizations from './organizations'
import * as sources from './sources'
import * as teams from './teams'

export const contextQueries = {
  ...organizations,
  ...teams,
  ...sources,
  ...connections,
  ...agents,
  ...conversations,
  ...messages,
  ...files,
}
