from typing import List, Optional
from embeddings import Embeddings
from llm import LLM
from vector_store import VectorStore
from langchain_core.documents import Document

class Agent:
    def __init__(
        self,
        llm: Optional[LLM] = None,
        embeddings: Optional[Embeddings] = None,
        vector_store: Optional[VectorStore] = None,
    ):
        self.llm = llm or LLM()
        self.embeddings = embeddings or Embeddings()
        self.vector_store = vector_store or VectorStore(embeddings=self.embeddings)

    def get_database_table_info(self, source_id: str, search: str) -> List[Document]:
        documents = self.vector_store.similarity_search(
            source_id=source_id,
            collection="database_table_info",
            query=search,
            k=10,
        )

        return documents

    def get_database_column_proper_names(self, source_id: str, key: str, search: str) -> List[Document]:
        documents = self.vector_store.similarity_search(
            source_id=source_id,
            collection="database_column_proper_names",
            query=search,
            k=10,
            filter=f"key: '{key}'",
        )

        return documents
