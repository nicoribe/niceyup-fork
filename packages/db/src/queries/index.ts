import * as agents from './agents'
import * as conversations from './conversations'
import * as messages from './messages'
import * as organizations from './organizations'

export const queries = {
  ...organizations,
  ...agents,
  ...conversations,
  ...messages,
}
