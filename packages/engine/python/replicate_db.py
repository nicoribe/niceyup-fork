import asyncio
import json
import sys
import os
from typing import Optional
from py_logger import PyLogger
from database_client import DatabaseClient
from database_replicator import DatabaseReplicator

logger = PyLogger(__name__)

async def main(
    source_id: str,
    workspace_id: str,
    dialect: Optional[str] = None,
    file_path: Optional[str] = None,
    tables_metadata: Optional[dict] = None,
) -> None:
    host = os.getenv("DATABASE_CLIENT_HOST")
    port = os.getenv("DATABASE_CLIENT_PORT")
    user = os.getenv("DATABASE_CLIENT_USER")
    password = os.getenv("DATABASE_CLIENT_PASSWORD")
    database = os.getenv("DATABASE_CLIENT_DATABASE")
    schema = os.getenv("DATABASE_CLIENT_SCHEMA")

    client = DatabaseClient(
        dialect=dialect,
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        schema=schema,
        file_path=file_path,
    )

    replicator = DatabaseReplicator(client)

    replicator.replicate(tables_metadata)

    logger.info({
        "status": "success",
        "message": "Database replicated successfully",
    })

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            logger.info({"status": "error", "message": "No args provided"})
            sys.exit(1)
        scriptArgs = json.loads(sys.argv[1])
        logger.info({ "status": None, "message": "Script started!", "args": scriptArgs })
        asyncio.run(main(**scriptArgs))
        logger.info({"status": "success", "message": "Script ended!"})
        sys.exit(0)
    except Exception as e:
        logger.info({"status": "error", "message": str(e)})
        sys.exit(1)
