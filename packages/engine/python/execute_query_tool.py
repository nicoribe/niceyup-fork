import sys
import json
import asyncio

from typing import List, Optional
from langchain_community.utilities import SQLDatabase
from langchain_community.tools.sql_database.tool import QuerySQLDatabaseTool

from py_logger import PyLogger
from source_storage import SourceStorage
from database_client import DatabaseClient
from database_replicator import DatabaseReplicator

logger = PyLogger(__name__)

async def main(
    source_id: str,
    query: str,
    table_names: Optional[List[str]] = None
):
    source = SourceStorage(source_id)

    db_client = DatabaseClient()

    replicator = DatabaseReplicator(source, db_client)
    replicator.create_tables_from_parquet(table_names)

    db = SQLDatabase.from_uri(database_uri=db_client.uri())
    execute_query_tool = QuerySQLDatabaseTool(db=db)
    result = execute_query_tool.invoke(query)

    db_client.close()

    return {"result": result}

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
