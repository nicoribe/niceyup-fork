import { getDbSchema } from './get-db-schema'
import { replicateDb } from './replicate-db'
import { runIngestion } from './run-ingestion'

export const python = {
  getDbSchema,
  replicateDb,
  runIngestion,
}
