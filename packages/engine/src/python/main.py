import asyncio
import json
import sys
import os

from utils import PyLogger

logger = PyLogger(__name__)

async def main(name: str) -> None:
    logger.info(f"Hello, {name}!")

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