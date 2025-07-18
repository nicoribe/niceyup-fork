from typing import List, Optional, Any
from langchain_core.documents import Document
from langchain_community.vectorstores.upstash import UpstashVectorStore

from embeddings_provider import EmbeddingsProvider  

class VectorStoreProvider(UpstashVectorStore):
    DEFAULT = "__default__"

    def __init__(self, embeddings: Optional[EmbeddingsProvider] = None, namespace: Optional[str] = None, **kwargs):
        self.namespace = namespace or self.DEFAULT
        super().__init__(embedding=embeddings or EmbeddingsProvider(), namespace=self.namespace, **kwargs)

    def similarity_search(
        self,
        source_id: str,
        collection: Optional[str],
        query: str,
        k: int = 10,
        filter: Optional[str] = None,
        **kwargs: Any
    ) -> List[Document]:
        _filter = f"source_id: '{source_id}' AND collection: '{collection or self.DEFAULT}' OR " + (filter or "")

        return super().similarity_search(query, k=k, filter=_filter, namespace=self.namespace, **kwargs)

    def add_documents(
        self,
        source_id: str,
        collection: Optional[str],
        documents: List[Document],
        **kwargs: Any
    ) -> List[str]:
        for doc in documents:
            doc.metadata["source_id"] = source_id
            doc.metadata["collection"] = collection or self.DEFAULT

        return super().add_documents(documents, namespace=self.namespace, **kwargs)
