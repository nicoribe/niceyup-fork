import asyncio
import json
import sys
import os
from typing import Optional
from py_logger import PyLogger
from storage_provider import StorageProvider
from source_storage import SourceStorage
from database_client import DatabaseClient
from database_replicator import DatabaseReplicator, TableMetadata

logger = PyLogger(__name__)

async def main(
    workspace_id: str,
    source_id: str,
    dialect: Optional[str] = None,
    file_path: Optional[str] = None,
    tables_metadata: Optional[TableMetadata] = None,
) -> None:
    host = os.getenv("DATABASE_CLIENT_HOST")
    port = os.getenv("DATABASE_CLIENT_PORT")
    user = os.getenv("DATABASE_CLIENT_USER")
    password = os.getenv("DATABASE_CLIENT_PASSWORD")
    database = os.getenv("DATABASE_CLIENT_DATABASE")
    schema = os.getenv("DATABASE_CLIENT_SCHEMA")

    storage = StorageProvider(
        tmp_dir="./tmp",
    )
    
    if file_path:
        tmp_file_path = storage.download_tmp_file(file_path)

    client = DatabaseClient(
        dialect=dialect,
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        schema=schema,
        file_path=tmp_file_path,
        tmp_dir="./tmp",
    )

    source = SourceStorage(
        workspace_id=workspace_id,
        source_id=source_id,
        storage=storage,
    )
    replicator = DatabaseReplicator(
        source=source,
        client=client,
    )

    replicator.export_tables_to_parquet(tables_metadata)

    client.cleanup_tmp_path() # Close database client
    storage.cleanup_tmp_path() # Clean up tmp path

    logger.warning({
        "status": "success",
        "message": "Database replicated successfully",
    })

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            logger.error({"status": "error", "message": "No args provided"})
            sys.exit(1)
        scriptArgs = json.loads(sys.argv[1])
        logger.info({ "status": None, "message": "Script started!", "args": scriptArgs })
        asyncio.run(main(**scriptArgs))
        logger.info({"status": "success", "message": "Script ended!"})
        sys.exit(0)
    except Exception as e:
        logger.error({"status": "error", "message": str(e)})
        sys.exit(1)
