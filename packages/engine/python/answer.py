import asyncio
import json
import sys
from typing import Annotated, List, TypedDict
from py_logger import PyLogger
from llm import LLM
from embeddings import Embeddings
from vector_store import VectorStore
from agent import Agent
from storage_provider import StorageProvider
from source_storage import SourceStorage
from database_client import DatabaseClient
from database_replicator import DatabaseReplicator
from prompts import (
    relevant_tables_prompt_template,
    write_query_prompt_template,
    search_proper_nouns_prompt_template,
)
from langgraph.graph import START, StateGraph
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool
from langchain_community.utilities import SQLDatabase
from langchain_community.tools.sql_database.tool import QuerySQLDatabaseTool

logger = PyLogger(__name__)

class State(TypedDict):
    question: str
    table_info: str
    query: str
    proper_nouns: str
    result: str
    answer: str

class TableInfoOutput(TypedDict):
    """Relevant tables."""
    tables: Annotated[List[str], ..., "Relevant tables."]

class QueryOutput(TypedDict):
    """Generated SQL query."""
    query: Annotated[str, ..., "Syntactically valid SQL query."]

class QueryWithProperNounsOutput(TypedDict):
    """Proper nouns in the query."""
    query: Annotated[str, ..., "Syntactically valid SQL query."]
    proper_nouns: Annotated[str, ..., "Proper nouns in the query."]

async def main(question: str) -> None:
    workspace_id = "xxxx-xxxx-xxxx-xxxx"

    llm = LLM()
    embeddings = Embeddings()
    vector_store = VectorStore(embeddings=embeddings, workspace_id=workspace_id)
    agent = Agent(llm=llm, embeddings=embeddings, vector_store=vector_store)

    # ai_msg = llm.astream([
    #     SystemMessage(content="You are a helpful assistant! Your name is Davy Jones."),
    #     HumanMessage(content=question),
    # ])

    # async for chunk in ai_msg:
    #     logger.warning(chunk.model_dump())

    source_id = "xxxx-xxxx-xxxx-xxxx"

    storage = StorageProvider()
    db_client = DatabaseClient()

    @tool
    def search_proper_nouns(table_name: str, column_name: str, search: str) -> str:
        """Use to look up values to filter on. Input is an approximate spelling
        of the proper noun, output is valid proper nouns. Use the noun most
        similar to the search.
        """
        key = f"{table_name}.{column_name}"
        results = agent.get_structured_column_proper_names(source_id=source_id, key=key, search=search)
        return results[0].page_content if len(results) > 0 else search

    def get_table_info(state: State):
        """Get relevant tables from the database."""
        docs = agent.get_structured_table_info(source_id=source_id, search=state["question"])
        relevant_tables = [doc.metadata for doc in docs]
        tables_info = []
        for table in relevant_tables:
            table_info = f'CREATE TABLE "{table["table_name"]}" (\n'
            columns_info = []
            for column in table['columns']:
                references = ""
                if column["foreign_table"] is not None and column["foreign_column"] is not None:
                    references = f' REFERENCES "{column["foreign_table"]}" ("{column["foreign_column"]}")'
                columns_info.append(f'    "{column["column_name"]}" {column["data_type"]}{references}')
            table_info += ",\n".join(columns_info) + "\n)\n"
            tables_info.append(table_info)
        prompt = relevant_tables_prompt_template.invoke(
            {
                "table_info": "\n".join(tables_info),
                "input": state["question"],
            }
        )
        structured_llm = llm.with_structured_output(TableInfoOutput)
        result = structured_llm.invoke(prompt)
        source = SourceStorage(workspace_id=workspace_id, source_id=source_id, storage=storage)
        replicator = DatabaseReplicator(source=source, db_client=db_client)
        replicator.create_tables_from_parquet(table_names=result["tables"])
        db = SQLDatabase.from_uri(database_uri=db_client.uri())
        return {"table_info": db.get_table_info()}

    def write_query(state: State):
        """Generate SQL query to fetch information."""
        prompt = write_query_prompt_template.invoke(
            {
                "dialect": "DuckDB",
                "top_k": 10,
                "table_info": state["table_info"],
                "input": state["question"],
            }
        )
        structured_llm = llm.with_structured_output(QueryOutput)
        result = structured_llm.invoke(prompt)
        return {"query": result["query"]}

    def search_proper_nouns_query(state: State):
        """Search proper nouns in the query."""
        prompt = search_proper_nouns_prompt_template.invoke({"query": state["query"]})
        agent_executor = create_react_agent(
            model=llm,
            tools=[search_proper_nouns],
            response_format=QueryWithProperNounsOutput,
        )
        result = agent_executor.invoke(prompt)
        return {
            "query": result["structured_response"]["query"],
            "proper_nouns": result["structured_response"]["proper_nouns"],
        }

    def execute_query(state: State):
        """Execute SQL query."""
        db = SQLDatabase.from_uri(database_uri=db_client.uri())
        execute_query_tool = QuerySQLDatabaseTool(db=db)
        return {"result": execute_query_tool.invoke(state["query"])}

    def generate_answer(state: State):
        """Answer question using retrieved information as context."""
        prompt = (
            "Given the following user question, corresponding SQL query, "
            "and SQL result, answer the user question.\n\n"
            f"Question: {state['question']}\n"
            f"SQL Query: {state['query']}\n"
            f"Proper Nouns: {state['proper_nouns']}\n"
            f"SQL Result: {state['result']}"
        )
        response = llm.stream(prompt)
        content = ""
        for chunk in response:
            content += chunk.content
            logger.info({"message": "AIMessageChunk", **chunk.model_dump()})
        return {"answer": content}

    graph_builder = StateGraph(State).add_sequence([
        get_table_info,
        write_query,
        search_proper_nouns_query,
        execute_query,
        generate_answer,
    ])
    graph_builder.add_edge(START, "get_table_info")
    graph = graph_builder.compile()

    steps = graph.stream(
        {
            "question": question,
            "query": "",
            "result": "",
            "answer": "",
        },
        stream_mode="updates",
    )

    for step in steps:
        step_name, = step
        logger.warning({"message": step_name, "step": step})

    db_client.dispose()
    storage.cleanup_tmp_path() # Clean up tmp path

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
