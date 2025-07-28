from typing import List
from vector_store import VectorStore
from langchain_core.documents import Document

class Agent:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store

    def get_structured_tables_info(self, source_id: str, search: str) -> List[Document]:
        documents = self.vector_store.similarity_search(
            source_id=source_id,
            collection="structured_tables_info",
            query=search,
            k=15,
        )
        return documents

    # def get_structured_table_info(self, source_id: str, table_name: str) -> List[Document]:
    #     documents = self.vector_store.similarity_search(
    #         source_id=source_id,
    #         collection="structured_tables_info",
    #         query=f'Table: "{table_name}"',
    #         k=1,
    #         filter=f"table_name = '{table_name}'",
    #     )
    #     return documents

    # def get_structured_tables_info_by_names(self, source_id: str, table_names: List[str]) -> List[Document]:
    #     documents = []
    #     for table_name in table_names:
    #         documents.extend(self.get_structured_table_info(source_id=source_id, table_name=table_name))
    #     return documents

    def get_structured_query_examples(self, source_id: str, search: str) -> List[Document]:
        documents = self.vector_store.similarity_search(
            source_id=source_id,
            collection="structured_query_examples",
            query=search,
            k=15,
        )
        return documents

    def get_structured_columns_proper_names(self, source_id: str, key: str, search: str) -> List[Document]:
        documents = self.vector_store.similarity_search(
            source_id=source_id,
            collection="structured_columns_proper_names",
            query=search,
            k=1,
            filter=f"key = '{key}'",
        )
        return documents
