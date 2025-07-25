import asyncio
import json
import sys
import os
from typing import Optional
from py_logger import PyLogger
from database_client import DatabaseClient

logger = PyLogger(__name__)

async def main(
    dialect: Optional[str] = None,
    file_path: Optional[str] = None,
) -> None:
    host = os.getenv("DATABASE_CLIENT_HOST")
    port = os.getenv("DATABASE_CLIENT_PORT")
    user = os.getenv("DATABASE_CLIENT_USER")
    password = os.getenv("DATABASE_CLIENT_PASSWORD")
    database = os.getenv("DATABASE_CLIENT_DATABASE")
    schema = os.getenv("DATABASE_CLIENT_SCHEMA")

    db_client = DatabaseClient(
        dialect=dialect,
        host=host,
        port=port,
        user=user,
        password=password,
        database=database,
        schema=schema,
        file_path=file_path,
    )

    db_schema = db_client.get_db_schema()

    logger.warning({
        "tables_metadata": db_schema,
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
