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
from langgraph.graph import START, StateGraph
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.utilities import SQLDatabase
from langchain_community.tools.sql_database.tool import QuerySQLDatabaseTool

logger = PyLogger(__name__)

class State(TypedDict):
    question: str
    table_info: str
    query: str
    result: str
    answer: str

class TableInfoOutput(TypedDict):
    """Relevant tables."""

    tables: Annotated[List[str], ..., "Relevant tables."]

class QueryOutput(TypedDict):
    """Generated SQL query."""

    query: Annotated[str, ..., "Syntactically valid SQL query."]

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

    storage = StorageProvider(tmp_dir="./tmp")
    source = SourceStorage(workspace_id=workspace_id, source_id=source_id, storage=storage)

    client = DatabaseClient(tmp_dir="./tmp")

    relevant_tables_system_message = """
You are an assistant that helps identify which tables in a database schema are relevant to a given user question.

Given a database schema and a natural language question, return a list of **only the relevant table names** that contain useful information to answer the question.

Rules:
- Only use table names from the provided schema.
- Do not make up table names.
- If a relevant table has a foreign key (FK) reference to another table, **also include that related table**, since it's likely part of the query join.
- Focus on semantic relevance: include only the tables that would logically contribute to building a correct SQL query.
- If the question can be answered using a single table, still check for any FKs that might be needed.

Schema:
{table_info}
"""

    relevant_tables_user_prompt = "Question: {input}"

    relevant_tables_prompt_template = ChatPromptTemplate(
        [("system", relevant_tables_system_message), ("user", relevant_tables_user_prompt)]
    )

    system_message = """
Given an input question, create a syntactically correct {dialect} query to
run to help find the answer. Unless the user specifies in his question a
specific number of examples they wish to obtain, always limit your query to
at most {top_k} results. You can order the results by a relevant column to
return the most interesting examples in the database.

Never query for all the columns from a specific table, only ask for a the
few relevant columns given the question.

Pay attention to use only the column names that you can see in the schema
description. Be careful to not query for columns that do not exist. Also,
pay attention to which column is in which table.

Only use the following tables:
{table_info}
"""

    user_prompt = "Question: {input}"

    query_prompt_template = ChatPromptTemplate(
        [("system", system_message), ("user", user_prompt)]
    )

    def get_table_info(state: State):
        """Get relevant tables from the database."""
        docs = agent.get_structured_table_info(source_id=source_id, search=state["question"])
        relevant_tables = [doc.metadata for doc in docs]

        table_info = ""
        for table in relevant_tables:
            table_info += f'\nCREATE TABLE "{table["table_name"]}" (\n'
            columns_info = []
            for column in table['columns']:
                references = ""
                if column["foreign_table"] is not None and column["foreign_column"] is not None:
                    references = f' REFERENCES "{column["foreign_table"]}" ("{column["foreign_column"]}")'
                columns_info.append(f'    "{column["column_name"]}" {column["data_type"]}{references}')
            table_info += ",\n".join(columns_info) + "\n)\n"

        prompt = relevant_tables_prompt_template.invoke(
            {
                "table_info": table_info,
                "input": state["question"],
            }
        )
        structured_llm = llm.with_structured_output(TableInfoOutput)
        result = structured_llm.invoke(prompt)

        replicator = DatabaseReplicator(source=source, client=client)
        replicator.create_tables_from_parquet(table_names=result["tables"])
        db = SQLDatabase.from_uri(database_uri=client.uri())

        return {"table_info": db.get_table_info()}

    def write_query(state: State):
        """Generate SQL query to fetch information."""
        prompt = query_prompt_template.invoke(
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

    def execute_query(state: State):
        """Execute SQL query."""
        db = SQLDatabase.from_uri(database_uri=client.uri())
        execute_query_tool = QuerySQLDatabaseTool(db=db)
        return {"result": execute_query_tool.invoke(state["query"])}

    def generate_answer(state: State):
        """Answer question using retrieved information as context."""
        prompt = (
            "Given the following user question, corresponding SQL query, "
            "and SQL result, answer the user question.\n\n"
            f"Question: {state['question']}\n"
            f"SQL Query: {state['query']}\n"
            f"SQL Result: {state['result']}"
        )
        response = llm.stream(prompt)

        content = ""
        for chunk in response:
            content += chunk.content
            logger.info({
                "message": "AIMessageChunk",
                **chunk.model_dump(),
            })

        return {"answer": content}

    graph_builder = StateGraph(State).add_sequence(
        [get_table_info, write_query, execute_query, generate_answer]
    )
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
        logger.warning({
            "message": step_name,
            "step": step,
        })

    client.cleanup_tmp_path() # Clean up tmp path
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
