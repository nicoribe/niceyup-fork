import asyncio
import json
import sys
from typing import Annotated, List, Literal, TypedDict, Union
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
    relevant_tables: Annotated[Union[List[str], str], ..., "Relevant tables."]
    # current_request_num: Annotated[int, ..., "Current request number."]
    # request_tables_info: Annotated[List[str], ..., "Tables to request info for."]
    query_examples: Annotated[str, ..., "Examples of the query."]
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
    # request_tables_info: Annotated[List[str], ..., "Tables to request info for."]
    tables: Annotated[List[str], ..., "Relevant tables."]

class QueryOutput(TypedDict):
    """Generated SQL query."""
    query: Annotated[str, ..., "Syntactically valid SQL query."]

class QueryWithProperNounsOutput(TypedDict):
    """Proper nouns in the query."""
    query: Annotated[str, ..., "Syntactically valid SQL query."]
    proper_nouns: Annotated[str, ..., "Proper nouns in the query."]

async def main(
    workspace_id: str,
    source_ids: List[str],
    question: str,
) -> None:
    llm = LLM()
    embeddings = Embeddings()
    vector_store = VectorStore(embeddings=embeddings, workspace_id=workspace_id)
    agent = Agent(vector_store=vector_store)

    storage = StorageProvider()
    db_client = DatabaseClient()

    def retrieve_document(state: State):
        """Retrieve document from the source."""
        documents = vector_store.similarity_search_by_source_ids(
            source_ids=source_ids,
            query=state["question"],
            k=1,
        )
        if len(documents) == 0:
            return {"document": "No document found."}
        document = documents[0]
        return {
            "source_id": document.metadata["__source_id"],
            "source_type": document.metadata["source_type"],
            "document": document.page_content,
        }

    def generate_answer(state: State):
        """Generate answer to the user question."""
        prompt = (
            "Given the following user question and document from the source, "
            "answer the user question.\n"
            f"Question: {state['question']}\n"
            f"Document: {state['document']}"
        )
        response = llm.stream(prompt)
        content = ""
        for chunk in response:
            content += chunk.content
            logger.info({"message": "AIMessageChunk", **chunk.model_dump()})
        return {"answer": content}

    def relevant_tables(state: State):
        """Get relevant tables from the database."""
        is_first_request = bool("structured" not in state)
        tables_info = [] if is_first_request else state["structured"]["relevant_tables"]
        # current_request_num = 1 if is_first_request else state["structured"]["current_request_num"]
        if is_first_request:
            table_docs = agent.get_structured_tables_info(
                source_id=state["source_id"],
                search=state["question"],
            )
        # else:
        #     table_docs = agent.get_structured_tables_info_by_names(
        #         source_id=state["source_id"],
        #         table_names=state["structured"]["request_tables_info"],
        #     )
        relevant_tables = [doc.metadata for doc in table_docs]
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
        if is_first_request:
            example_docs = agent.get_structured_query_examples(source_id=state["source_id"], search=state["question"])
            query_examples = "\n".join(doc.page_content for doc in example_docs)
        # else:
        #     query_examples = state["structured"]["query_examples"]
        prompt = relevant_tables_prompt_template.invoke({
            "tables_info": "\n".join(tables_info),
            # "max_request_tables_num": 5,
            # "current_request_num": current_request_num,
            # "max_request_num": max_request_num,
            "examples": query_examples,
            "input": state["question"],
        })
        structured_llm = llm.with_structured_output(RelevantTablesOutput)
        result = structured_llm.invoke(prompt)
        # if "request_tables_info" in result and len(result["request_tables_info"]) > 0 and current_request_num < max_request_num:
        #     return {
        #         "structured": {
        #             "relevant_tables": tables_info,
        #             "current_request_num": current_request_num + 1,
        #             "request_tables_info": result["request_tables_info"],
        #             "query_examples": query_examples,
        #         }
        #     }
        return {
            "structured": {
                "relevant_tables": result["tables"],
                "query_examples": query_examples,
            }
        }

    def retrieve_tables_info(state: State):
        """Retrieve tables info from the database."""
        source = SourceStorage(workspace_id=workspace_id, source_id=state["source_id"], storage=storage)
        replicator = DatabaseReplicator(source=source, db_client=db_client)
        replicator.create_tables_from_parquet(table_names=state["structured"]["relevant_tables"])
        db = SQLDatabase.from_uri(database_uri=db_client.uri())
        return {
            "structured": {
                "relevant_tables": db.get_table_info(),
                "query_examples": state["structured"]["query_examples"],
            }
        }

    def write_query(state: State):
        """Generate SQL query to fetch information."""
        prompt = write_query_prompt_template.invoke({
            "dialect": "DuckDB",
            "top_k": 10,
            "tables_info": state["structured"]["relevant_tables"],
            "examples": state["structured"]["query_examples"],
            "input": state["question"],
        })
        structured_llm = llm.with_structured_output(QueryOutput)
        result = structured_llm.invoke(prompt)
        return {
            "structured": {"query": result["query"]}
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
            results = agent.get_structured_columns_proper_names(source_id=state["source_id"], key=key, search=search)
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
            "structured": {**state["structured"], "result": result}
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
        if state["source_type"] == "structured":
            return "relevant_tables"
        else:
            return "generate_answer"

    # def should_request_tables(state: State) -> Literal["relevant_tables", "retrieve_tables_info"]:
    #     if "current_request_num" in state["structured"]:
    #         return "relevant_tables"
    #     else:
    #         return "retrieve_tables_info"

    graph_builder = StateGraph(State)
    graph_builder.add_node(retrieve_document)
    graph_builder.add_node(generate_answer)
    graph_builder.add_node(relevant_tables)
    graph_builder.add_node(retrieve_tables_info)
    graph_builder.add_node(write_query)
    graph_builder.add_node(search_proper_nouns_query)
    graph_builder.add_node(execute_query)
    graph_builder.add_node(generate_query_answer)

    graph_builder.add_edge(START, "retrieve_document")
    graph_builder.add_conditional_edges("retrieve_document", should_query)
    graph_builder.add_edge("generate_answer", END)
    graph_builder.add_edge("relevant_tables", "retrieve_tables_info")
    # graph_builder.add_conditional_edges("relevant_tables", should_request_tables)
    graph_builder.add_edge("retrieve_tables_info", "write_query")
    graph_builder.add_edge("write_query", "search_proper_nouns_query")
    graph_builder.add_edge("search_proper_nouns_query", "execute_query")
    graph_builder.add_edge("execute_query", "generate_query_answer")
    graph_builder.add_edge("generate_query_answer", END)

    graph = graph_builder.compile()

    input = {
        "question": question,
    }

    steps = graph.astream(input, stream_mode="updates")

    async for step in steps:
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
