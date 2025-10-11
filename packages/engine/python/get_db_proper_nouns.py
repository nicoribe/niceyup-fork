import sys
import json
import asyncio

from typing import Optional

from py_logger import PyLogger
from source_storage import SourceStorage
from database_client import DatabaseClient
from database_replicator import DatabaseReplicator, TableMetadata

logger = PyLogger(__name__)

async def main(
    source_id: str,
    tables_metadata: Optional[TableMetadata] = None,
):
    table_names = [table["name"] for table in tables_metadata]
    tables_column_proper_nouns = []

    if len(table_names) > 0:
        source = SourceStorage(source_id)

        db_client = DatabaseClient()

        replicator = DatabaseReplicator(source, db_client)
        replicator.create_tables_from_parquet(table_names)

        for table in tables_metadata:
            for column in table["columns"]:
                result = db_client.execute(f'SELECT DISTINCT "{column["name"]}" FROM "{table["name"]}"')
                result_df = result.fetchdf() # TODO: Use fetch_df_chunk

                column["proper_nouns"] = result_df[column["name"]].tolist()

                tables_column_proper_nouns.append(table)

    return tables_column_proper_nouns

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            logger.error({"status": "error", "message": "No args provided"})
            sys.exit(1)
        scriptArgs = json.loads(sys.argv[1])
        logger.info({ "status": None, "message": "Script started!", "args": scriptArgs })
        result = asyncio.run(main(**scriptArgs))
        logger.warning(result)
        logger.info({"status": "success", "message": "Script ended!"})
        sys.exit(0)
    except Exception as e:
        logger.error({"status": "error", "message": str(e)})
        sys.exit(1)
