from typing import List
from vector_store import VectorStore
from langchain_core.documents import Document

class Agent:
    def __init__(self, vector_store: VectorStore):
        self.vector_store = vector_store

    def get_structured_table_info(self, source_id: str, search: str) -> List[Document]:
        documents = self.vector_store.similarity_search(
            source_id=source_id,
            collection="structured_tables_info",
            query=search,
            k=10,
        )

        return documents

    def get_structured_column_proper_names(self, source_id: str, key: str, search: str) -> List[Document]:
        documents = self.vector_store.similarity_search(
            source_id=source_id,
            collection="structured_columns_proper_names",
            query=search,
            k=1,
            filter=f"key = '{key}'",
        )

        return documents
