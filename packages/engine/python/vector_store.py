from typing import List, Optional, Any, Iterable
from langchain_core.documents import Document
from langchain_community.vectorstores.upstash import UpstashVectorStore
from embeddings import Embeddings

class VectorStore(UpstashVectorStore):
    DEFAULT = "__default__"

    def __init__(
        self,
        embeddings: Optional[Embeddings] = None,
        workspace_id: Optional[str] = None,
        **kwargs,
    ):
        _embeddings = embeddings or Embeddings()
        self.workspace_id = workspace_id or self.DEFAULT
        super().__init__(embedding=_embeddings, namespace=self.workspace_id, **kwargs)

    def similarity_search(
        self,
        source_id: str,
        collection: Optional[str],
        query: str,
        k: int = 10,
        filter: Optional[str] = None,
        **kwargs: Any,
    ) -> List[Document]:
        _filter = (
            f"__source_id: '{source_id}'"
            f" AND __collection: '{collection or self.DEFAULT}'"
            (f" AND {filter}" if filter else "")
        )

        return super().similarity_search(query, k=k, filter=_filter, namespace=self.workspace_id, **kwargs)

    def add_documents(
        self,
        source_id: str,
        collection: Optional[str],
        documents: List[Document],
        **kwargs: Any,
    ) -> List[str]:
        for doc in documents:
            doc.metadata["__source_id"] = source_id
            doc.metadata["__collection"] = collection or self.DEFAULT

        return super().add_documents(documents, namespace=self.workspace_id, **kwargs)
