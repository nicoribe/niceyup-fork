from typing import List, Optional, TypedDict
from llm import LLM
from vector_store import VectorStore
from prompts import structured_summary_prompt_template
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
    columns: List[ColumnInfo]

class ColumnInfoWithProperNames(TypedDict):
    name: str
    proper_names: List[str]

class TableInfoWithColumnProperNames(TypedDict):
    name: str
    columns: List[ColumnInfoWithProperNames]

class Ingestor:
    def __init__(self, llm: LLM, vector_store: VectorStore):
        self.llm = llm
        self.vector_store = vector_store

    def ingest_text(self, source_id: str) -> None:
        pass

    def ingest_pdf(self, source_id: str) -> None:
        pass

    def ingest_website(self, source_id: str) -> None:
        pass

    def ingest_question_answer(self, source_id: str) -> None:
        pass

    def ingest_structured(self, source_id: str, tables: List[TableInfo]) -> None:
        tables_info = ""
        for table in tables:
            tables_info += "\n-\n" + self._table_description(
                table_name=table["name"],
                table_description=table.get("description", None),
            )
            for column in table["columns"]:
                tables_info += self._column_description(
                    column_name=column["name"],
                    column_description=column.get("description", None),
                )
        prompt = structured_summary_prompt_template.invoke({
            "tables_info": tables_info,
        })
        result = self.llm.invoke(prompt)
        document = Document(
            page_content=result.content,
            metadata={
                "source_type": "structured",
            },
        )
        self.vector_store.add_documents(
            source_id=source_id,
            collection="sources",
            documents=[document],
        )

    def ingest_structured_table_info(self, source_id: str, tables: List[TableInfo]) -> None:
        documents = []
        for table in tables:
            table_info = self._table_description(
                table_name=table["name"],
                table_description=table.get("description", None),
            )
            metadata = {
                "table_name": table["name"],
                "columns": []
            }
            for column in table["columns"]:
                table_info += self._column_description(
                    column_name=column["name"],
                    column_description=column.get("description", None),
                    foreign_table=column.get("foreign_table", None),
                    foreign_column=column.get("foreign_column", None),
                )
                metadata["columns"].append({
                    "column_name": column["name"],
                    "data_type": column["data_type"],
                    "foreign_table": column.get("foreign_table", None),
                    "foreign_column": column.get("foreign_column", None),
                })
            documents.append(
                Document(
                    page_content=table_info,
                    metadata=metadata,
                )
            )
        self.vector_store.add_documents(
            source_id=source_id,
            collection="structured_tables_info",
            documents=documents,
        )

    def ingest_structured_column_proper_names(self, source_id: str, tables: List[TableInfoWithColumnProperNames]) -> None:
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
            collection="structured_columns_proper_names",
            documents=documents,
        )

    def _table_description(
        self,
        table_name: str,
        table_description: Optional[str] = None,
    ) -> str:
        table_str = f'Table: "{table_name}"\n'
        if table_description is not None and table_description != "":
            table_str += f"Description: {table_description}\n"
        table_str += 'Columns:\n'
        return table_str

    def _column_description(
        self,
        column_name: str,
        column_description: Optional[str] = None,
        foreign_table: Optional[str] = None,
        foreign_column: Optional[str] = None,
    ) -> str:
        column_str = f'-\n"{column_name}"'
        if foreign_table is not None and foreign_column is not None:
            column_str += f' relations "{foreign_table}"."{foreign_column}"'
        if column_description is not None and column_description != "":
            column_str += f"\nDescription: {column_description}"
        column_str += "\n"
        return column_str
