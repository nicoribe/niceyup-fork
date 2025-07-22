import json
from typing import Optional, TypedDict
from embeddings import Embeddings
from llm import LLM
from vector_store import VectorStore
from langchain_core.documents import Document

class ColumnInfo(TypedDict):
    name: str
    description: str
    data_type: str
    foreign_table: Optional[str]
    foreign_column: Optional[str]

class TableInfo(TypedDict):
    name: str
    description: str
    columns: list[ColumnInfo]

class Ingestor:
    def __init__(
        self,
        llm: Optional[LLM] = None,
        embeddings: Optional[Embeddings] = None,
        vector_store: Optional[VectorStore] = None,
    ):
        self.llm = llm or LLM()
        self.embeddings = embeddings or Embeddings()
        self.vector_store = vector_store or VectorStore(embeddings=self.embeddings)

    def ingest_database_table_info(self, source_id: str, tables: list[TableInfo]) -> None:
        documents = []

        for table in tables:
            table_info = (
                f'Table: "{table["name"]}"\n'
                f'Description: {table["description"]}\n'
                'Columns:\n'
            )
            for column in table["columns"]:
                table_info += f'"{column["name"]}" ({column["data_type"]})'
                if column["foreign_table"] and column["foreign_column"]:
                    table_info += f' relations "{column["foreign_table"]}"."{column["foreign_column"]}"\n'
                else:
                    table_info += '\n'
                table_info += f'Description: {column["description"]}\n-\n'

            documents.append(
                Document(
                    page_content=table_info,
                    metadata={
                        "key": table["name"],
                    },
                )
            )

        self.vector_store.add_documents(
            source_id=source_id,
            collection="database_table_info",
            documents=documents,
        )

    def ingest_database_column_proper_names(self, source_id: str, tables: list[TableInfo]) -> None:
        documents = []

        for table in tables:
            for column in table["columns"]:
                documents.append(
                    Document(
                        page_content=column["name"],
                        metadata={
                            "key": f"{table["name"]}.{column["name"]}",
                        },
                    )
                )

        self.vector_store.add_documents(
            source_id=source_id,
            collection="database_column_proper_names",
            documents=documents,
        )
