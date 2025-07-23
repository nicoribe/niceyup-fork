from typing import Optional, TypedDict
from embeddings import Embeddings
from llm import LLM
from vector_store import VectorStore
from langchain_core.documents import Document

class ColumnInfo(TypedDict):
    name: str
    description: Optional[str]
    data_type: str
    foreign_table: Optional[str]
    foreign_column: Optional[str]

class TableInfo(TypedDict):
    name: str
    description: Optional[str]
    columns: list[ColumnInfo]

class ColumnInfoWithProperNames(TypedDict):
    name: str
    proper_names: list[str]

class TableInfoWithColumnProperNames(TypedDict):
    name: str
    columns: list[ColumnInfoWithProperNames]

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
            metadata = {
                "table_name": table["name"],
                "columns": []
            }
            for column in table["columns"]:
                table_info += f'-\n"{column["name"]}"'
                if column["foreign_table"] is not None and column["foreign_column"] is not None:
                    table_info += f' relations "{column["foreign_table"]}"."{column["foreign_column"]}"\n'
                else:
                    table_info += '\n'
                table_info += f'Description: {column["description"]}\n'
                metadata["columns"].append({
                    "column_name": column["name"],
                    "data_type": column["data_type"],
                    "foreign_table": column["foreign_table"],
                    "foreign_column": column["foreign_column"],
                })

            documents.append(
                Document(
                    page_content=table_info,
                    metadata=metadata,
                )
            )

        self.vector_store.add_documents(
            source_id=source_id,
            collection="database_table_info",
            documents=documents,
        )

    def ingest_database_column_proper_names(self, source_id: str, tables: list[TableInfoWithColumnProperNames]) -> None:
        documents = []

        for table in tables:
            for column in table["columns"]:
                for proper_name in column["proper_names"]:
                    documents.append(
                        Document(
                            page_content=proper_name,
                            metadata={
                                "key": f'{table["name"]}.{column["name"]}',
                            },
                        )
                    )

        self.vector_store.add_documents(
            source_id=source_id,
            collection="database_column_proper_names",
            documents=documents,
        )
