import { executeQueryTool } from './execute-query-tool'
import { getDbProperNouns } from './get-db-proper-nouns'
import { getDbSchema } from './get-db-schema'
import { runDbReplication } from './run-db-replication'

export const python = {
  getDbSchema,
  runDbReplication,
  getDbProperNouns,
  executeQueryTool,
}
