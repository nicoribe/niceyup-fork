import asyncio
import json
import sys
from typing import Annotated, List, Literal, TypedDict
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
from langgraph.graph import START, END, StateGraph
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool
from langchain_community.utilities import SQLDatabase
from langchain_community.tools.sql_database.tool import QuerySQLDatabaseTool

logger = PyLogger(__name__)

class StateStructured(TypedDict):
    """Structured state for structured sources."""
    relevant_tables: Annotated[str, ..., "Relevant tables."]
    query: Annotated[str, ..., "Syntactically valid SQL query."]
    proper_nouns: Annotated[str, ..., "Proper nouns in the query."]
    result: Annotated[str, ..., "Result of the query."]

class State(TypedDict):
    """State for unstructured sources."""
    question: Annotated[str, ..., "User question."]
    source_id: Annotated[str, ..., "Source ID."]
    source_type: Annotated[str, ..., "Source type."]
    structured: Annotated[StateStructured, ..., "Structured state for structured sources."]
    document: Annotated[str, ..., "Document from the source."]
    answer: str

class RelevantTablesOutput(TypedDict):
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

    storage = StorageProvider()
    db_client = DatabaseClient()

    def retrieve_document(state: State):
        """Retrieve document from the source."""
        return {
            "source_id": "xxxx-xxxx-xxxx-xxxx",
            "source_type": "structured",
        }

    def generate_answer(state: State):
        """Generate answer to the user question."""
        return {
            "answer": "Hello, world!",
        }

    def relevant_tables(state: State):
        """Get relevant tables from the database."""
        docs = agent.get_structured_table_info(source_id=state["source_id"], search=state["question"])
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
        structured_llm = llm.with_structured_output(RelevantTablesOutput)
        result = structured_llm.invoke(prompt)
        source = SourceStorage(workspace_id=workspace_id, source_id=state["source_id"], storage=storage)
        replicator = DatabaseReplicator(source=source, db_client=db_client)
        replicator.create_tables_from_parquet(table_names=result["tables"])
        db = SQLDatabase.from_uri(database_uri=db_client.uri())
        return {
            "structured": {
                "relevant_tables": db.get_table_info(),
            }
        }

    def write_query(state: State):
        """Generate SQL query to fetch information."""
        prompt = write_query_prompt_template.invoke(
            {
                "dialect": "DuckDB",
                "top_k": 10,
                "table_info": state["structured"]["relevant_tables"],
                "input": state["question"],
            }
        )
        structured_llm = llm.with_structured_output(QueryOutput)
        result = structured_llm.invoke(prompt)
        return {
            "structured": {
                "query": result["query"],
            }
        }

    def search_proper_nouns_query(state: State):
        """Search proper nouns in the query."""
        prompt = search_proper_nouns_prompt_template.invoke({"query": state["structured"]["query"]})

        @tool
        def search_proper_nouns(table_name: str, column_name: str, search: str) -> str:
            """Use to look up values to filter on. Input is an approximate spelling
            of the proper noun, output is valid proper nouns. Use the noun most
            similar to the search.
            """
            key = f"{table_name}.{column_name}"
            results = agent.get_structured_column_proper_names(source_id=state["source_id"], key=key, search=search)
            return results[0].page_content if len(results) > 0 else search

        agent_executor = create_react_agent(
            model=llm,
            tools=[search_proper_nouns],
            response_format=QueryWithProperNounsOutput,
        )
        result = agent_executor.invoke(prompt)
        return {
            "structured": {
                "query": result["structured_response"]["query"],
                "proper_nouns": result["structured_response"]["proper_nouns"],
            }
        }

    def execute_query(state: State):
        """Execute SQL query."""
        db = SQLDatabase.from_uri(database_uri=db_client.uri())
        execute_query_tool = QuerySQLDatabaseTool(db=db)
        result = execute_query_tool.invoke(state["structured"]["query"])
        return {
            "structured": {
                **state["structured"],
                "result": result,
            }
        }

    def generate_query_answer(state: State):
        """Answer question using retrieved information as context."""
        prompt = (
            "Given the following user question, corresponding SQL query, "
            "and SQL result, answer the user question.\n"
            "Make sure to explicitly mention any proper nouns that were adjusted in the query.\n\n"
            f"Question: {state['question']}\n"
            f"SQL Query: {state['structured']['query']}\n"
            f"Proper Nouns: {state['structured']['proper_nouns']}\n"
            f"SQL Result: {state['structured']['result']}"
        )
        response = llm.stream(prompt)
        content = ""
        for chunk in response:
            content += chunk.content
            logger.info({"message": "AIMessageChunk", **chunk.model_dump()})
        return {"answer": content}

    def should_query(state: State) -> Literal["generate_answer", "relevant_tables"]:
        source_type = state["source_type"]

        if source_type == "structured":
            return "relevant_tables"
        else:
            return "generate_answer"

    graph_builder = StateGraph(State)
    graph_builder.add_node(retrieve_document)
    graph_builder.add_node(generate_answer)
    graph_builder.add_node(relevant_tables)
    graph_builder.add_node(write_query)
    graph_builder.add_node(search_proper_nouns_query)
    graph_builder.add_node(execute_query)
    graph_builder.add_node(generate_query_answer)

    graph_builder.add_edge(START, "retrieve_document")
    graph_builder.add_conditional_edges(
        "retrieve_document",
        should_query,
    )
    graph_builder.add_edge("generate_answer", END)
    graph_builder.add_edge("relevant_tables", "write_query")
    graph_builder.add_edge("write_query", "search_proper_nouns_query")
    graph_builder.add_edge("search_proper_nouns_query", "execute_query")
    graph_builder.add_edge("execute_query", "generate_query_answer")
    graph_builder.add_edge("generate_query_answer", END)

    graph = graph_builder.compile()

    steps = graph.stream(
        {
            "question": question,
            "source_id": "",
            "source_type": "",
            "structured": {
                "relevant_tables": "",
                "query": "",
                "proper_nouns": "",
            },
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
