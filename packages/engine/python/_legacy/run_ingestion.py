import asyncio
import json
import sys
from typing import List, Optional
from py_logger import PyLogger
from llm import LLM
from embeddings import Embeddings
from vector_store import VectorStore
from ingestor import Ingestor, TableInfo, TableInfoWithColumnProperNames, QueryExample
from storage_provider import StorageProvider
from source_storage import SourceStorage
from database_client import DatabaseClient
from database_replicator import DatabaseReplicator

logger = PyLogger(__name__)

async def main(
    workspace_id: str,
    source_id: str,
    source_type: str,
    file_path: Optional[str] = None,
    tables_info: Optional[List[TableInfo]] = None,
    columns_proper_names_by_tables: Optional[List[TableInfoWithColumnProperNames]] = None,
    query_examples: Optional[List[QueryExample]] = None,
) -> None:
    logger.warning({
        "message": f'Ingestion started for source "{source_id}" of type "{source_type}" in workspace "{workspace_id}"',
    })

    llm = LLM()
    embeddings = Embeddings()
    vector_store = VectorStore(embeddings=embeddings, workspace_id=workspace_id)

    ingestor = Ingestor(llm=llm, vector_store=vector_store)

    storage = StorageProvider()
    
    tmp_file_path = storage.download_tmp_file(file_path) if file_path is not None else None

    if source_type == "text":
        ingestor.ingest_text(source_id=source_id, file_path=tmp_file_path)

    elif source_type == "pdf":
        ingestor.ingest_pdf(source_id=source_id, file_path=tmp_file_path)

    elif source_type == "website":
        ingestor.ingest_website(source_id=source_id)

    elif source_type == "question_answer":
        ingestor.ingest_question_answer(source_id=source_id)

    elif source_type == "structured":
        if tables_info is not None:
            ingestor.ingest_structured(source_id=source_id, tables=tables_info)
            ingestor.ingest_structured_tables_info(source_id=source_id, tables=tables_info)

        if columns_proper_names_by_tables is not None:
            table_names = [table["name"] for table in columns_proper_names_by_tables]
            if len(table_names) > 0:
                db_client = DatabaseClient()
                source = SourceStorage(workspace_id=workspace_id, source_id=source_id, storage=storage)
                replicator = DatabaseReplicator(source=source, db_client=db_client)
                replicator.create_tables_from_parquet(table_names=table_names)
                tables_with_proper_names = []
                for table in columns_proper_names_by_tables:
                    for column in table["columns"]:
                        result = db_client.execute(f'SELECT DISTINCT "{column["name"]}" FROM "{table["name"]}"')
                        result_df = result.fetchdf() # TODO: Use fetch_df_chunk
                        column["proper_names"] = result_df[column["name"]].tolist()
                        tables_with_proper_names.append(table)
                ingestor.ingest_structured_columns_proper_names(source_id=source_id, tables=tables_with_proper_names)
                db_client.dispose()

        if query_examples is not None:
            ingestor.ingest_structured_query_examples(source_id=source_id, query_examples=query_examples)

    storage.cleanup_tmp_path() # Clean up tmp path

    logger.warning({
        "status": "success",
        "message": f'Ingestion ended for source "{source_id}" of type "{source_type}" in workspace "{workspace_id}"',
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
