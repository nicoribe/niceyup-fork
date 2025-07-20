import asyncio
import json
import sys
from py_logger import PyLogger
from llm import LLM
from langchain_core.messages import SystemMessage, HumanMessage
# from typing import Annotated, TypedDict
# from langchain_community.utilities import SQLDatabase
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_community.tools.sql_database.tool import QuerySQLDatabaseTool
# from langgraph.graph import START, StateGraph

logger = PyLogger(__name__)

# class State(TypedDict):
#     question: str
#     query: str
#     result: str
#     answer: str

# class QueryOutput(TypedDict):
#     """Generated SQL query."""

#     query: Annotated[str, ..., "Syntactically valid SQL query."]

async def main(question: str) -> None:
    llm = LLM()

    # def write_query(state: State):
    #     """Generate SQL query to fetch information."""
    #     prompt = query_prompt_template.invoke(
    #         {
    #             "dialect": db.dialect,
    #             "top_k": 10,
    #             "table_info": db.get_table_info(),
    #             "input": state["question"],
    #         }
    #     )
    #     structured_llm = llm.with_structured_output(QueryOutput)
    #     result = structured_llm.invoke(prompt)
    #     return {"query": result["query"]}

    # def execute_query(state: State):
    #     """Execute SQL query."""
    #     execute_query_tool = QuerySQLDatabaseTool(db=db)
    #     return {"result": execute_query_tool.invoke(state["query"])}

    # def generate_answer(state: State):
    #     """Answer question using retrieved information as context."""
    #     prompt = (
    #         "Given the following user question, corresponding SQL query, "
    #         "and SQL result, answer the user question.\n\n"
    #         f"Question: {state['question']}\n"
    #         f"SQL Query: {state['query']}\n"
    #         f"SQL Result: {state['result']}"
    #     )
    #     response = llm.invoke(prompt)
    #     return {"answer": response.content}

    # graph_builder = StateGraph(State).add_sequence(
    #     [write_query, execute_query, generate_answer]
    # )
    # graph_builder.add_edge(START, "write_query")
    # graph = graph_builder.compile()

    # for step in graph.stream({"question": "How many employees are there?"}, stream_mode="updates"):
    #     logger.warning(step)

    ai_msg = llm.astream([
        SystemMessage(content="You are a helpful assistant! Your name is Davy Jones."),
        HumanMessage(content=question),
    ])

    async for chunk in ai_msg:
        logger.warning(chunk.model_dump())

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
