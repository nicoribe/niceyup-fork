import asyncio
import json
import sys
from py_logger import PyLogger
from llm_provider import LLMProvider
from langchain_core.messages import HumanMessage, SystemMessage

logger = PyLogger(__name__)

async def main(question: str) -> None:
    llm = LLMProvider()

    ai_msg = await llm.ainvoke([
        SystemMessage(content="You are a helpful assistant! Your name is Davy Jones."),
        HumanMessage(content=question)
    ])

    logger.info({
        "text_delta": ai_msg.content,
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
