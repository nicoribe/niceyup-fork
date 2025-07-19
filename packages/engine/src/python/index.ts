import { getDbSchema } from './get-db-schema'
import { helloWorld } from './hello-world'
import { replicateDb } from './replicate-db'
import { runIngestion } from './run-ingestion'

export const python = {
  helloWorld,
  getDbSchema,
  replicateDb,
  runIngestion,
}
