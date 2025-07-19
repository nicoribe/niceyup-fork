import asyncio
import json
import sys
from py_logger import PyLogger

logger = PyLogger(__name__)

async def main(source_id: str, workspace_id: str) -> None:
    logger.warning({
        "status": "success",
        "message": f"Ingestion started for source {source_id} in workspace {workspace_id}"
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
