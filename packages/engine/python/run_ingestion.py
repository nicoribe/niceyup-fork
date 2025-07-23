import asyncio
import json
import sys
from py_logger import PyLogger
from llm import LLM
from embeddings import Embeddings
from vector_store import VectorStore
from ingestor import Ingestor
from storage_provider import StorageProvider
from source_storage import SourceStorage
from database_client import DatabaseClient
from database_replicator import DatabaseReplicator

logger = PyLogger(__name__)

async def main(
    workspace_id: str,
    source_id: str,
) -> None:
    logger.warning({
        "message": f'Ingestion started for source "{source_id}" in workspace "{workspace_id}"',
    })

    llm = LLM()
    embeddings = Embeddings()
    vector_store = VectorStore(
        embeddings=embeddings,
        workspace_id=workspace_id,
    )

    ingestor = Ingestor(
        llm=llm,
        embeddings=embeddings,
        vector_store=vector_store,
    )

    storage = StorageProvider(
        tmp_dir="./tmp",
    )

    source = SourceStorage(
        workspace_id=workspace_id,
        source_id=source_id,
        storage=storage,
    )

    if True: # TODO: Validate if the source is of the database type
        client = DatabaseClient(
            tmp_dir="./tmp",
        )

        replicator = DatabaseReplicator(
            source=source,
            client=client,
        )
        replicator.create_tables_from_parquet()

        tables_info = [] # TODO: Get tables info from the database
        columns_proper_names_by_tables = [] # TODO: Get columns proper names from the database

        ingestor.ingest_database_table_info(
            source_id=source_id,
            tables=tables_info,
        )
        ingestor.ingest_database_column_proper_names(
            source_id=source_id,
            tables=columns_proper_names_by_tables,
        )

        client.cleanup_tmp_path() # Clean up tmp path
    storage.cleanup_tmp_path() # Clean up tmp path

    logger.warning({
        "status": "success",
        "message": f'Ingestion ended for source "{source_id}" in workspace "{workspace_id}"',
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
