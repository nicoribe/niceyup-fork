import asyncio
import logging
import json
import sys
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def main(name: str) -> None:
    logger.info(f"Hello, {name}!")

    print(json.dumps({"message": f"Hello, {name}!"}))

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"status": "error", "message": "No args provided"}))
            sys.exit(1)
        scriptArgs = json.loads(sys.argv[1])
        print(json.dumps({
            "status": None,
            "message": "[Script started]",
            "args": scriptArgs
        }))
        asyncio.run(main(**scriptArgs))
        print(json.dumps({"status": "success", "message": "[Script ended]"}))
        sys.exit(0)
    except Exception as e:
        print(json.dumps({"status": "error", "message": str(e)}))
        sys.exit(1)