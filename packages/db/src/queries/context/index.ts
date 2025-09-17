import * as agents from './agents'
import * as conversations from './conversations'
import * as files from './files'
import * as organizations from './organizations'
import * as sources from './sources'

export const contextQueries = {
  ...organizations,
  ...sources,
  ...agents,
  ...conversations,
  ...files,
}
