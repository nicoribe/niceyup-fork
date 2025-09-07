import { getDbSchema } from './get-db-schema'
import { replicateDb } from './replicate-db'
import { runIngestion } from './run-ingestion'

export const pythonLegacy = {
  getDbSchema,
  replicateDb,
  runIngestion,
}
