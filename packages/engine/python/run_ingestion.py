import asyncio
import json
import sys
from py_logger import PyLogger
from storage_provider import StorageProvider
from source_storage import SourceStorage
from llm import LLM
from embeddings import Embeddings
from vector_store import VectorStore
from agent import Agent
from ingestor import Ingestor

logger = PyLogger(__name__)

async def main(workspace_id: str,source_id: str) -> None:
    logger.warning({
        "message": f'Ingestion started for source "{source_id}" in workspace "{workspace_id}"',
    })

    storage = StorageProvider(
        tmp_dir="./tmp",
    )

    source = SourceStorage(
        workspace_id=workspace_id,
        source_id=source_id,
        storage=storage,
    )

    llm = LLM()
    embeddings = Embeddings()
    vector_store = VectorStore(
        embeddings=embeddings,
        workspace_id=workspace_id,
    )
    agent = Agent(
        llm=llm,
        embeddings=embeddings,
        vector_store=vector_store,
    )

    ingestor = Ingestor(
        source=source,
        llm=llm,
        embeddings=embeddings,
        vector_store=vector_store,
        agent=agent,
    )

    ingestor.run()

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
