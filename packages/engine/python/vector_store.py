from typing import List, Optional, Any
from langchain_core.documents import Document
from langchain_community.vectorstores.upstash import UpstashVectorStore
from embeddings import Embeddings
from py_logger import PyLogger

logger = PyLogger(__name__)

class VectorStore(UpstashVectorStore):
    DEFAULT = "__default__"

    def __init__(
        self,
        embeddings: Embeddings,
        workspace_id: Optional[str] = None,
        **kwargs,
    ):
        self.workspace_id = workspace_id if workspace_id is not None and workspace_id != "" else self.DEFAULT
        super().__init__(embedding=embeddings, namespace=self.workspace_id, **kwargs)

    def similarity_search_by_source_ids(
        self,
        source_ids: List[str],
        query: str,
        k: int = 10,
        **kwargs: Any,
    ) -> List[Document]:
        if len(source_ids) == 0:
            return []

        _filter_by_sources = " OR ".join([f"__source_id = '{source_id}'" for source_id in source_ids])
        _filter = (
            "__collection = 'sources' AND "
            f"({_filter_by_sources})"
        )

        return super().similarity_search(query, k=k, filter=_filter, namespace=self.workspace_id, **kwargs)

    def similarity_search(
        self,
        source_id: str,
        collection: Optional[str],
        query: str,
        k: int = 10,
        filter: Optional[str] = None,
        **kwargs: Any,
    ) -> List[Document]:
        _collection = collection if collection is not None and collection != "" else self.DEFAULT
        _filter = (
            f"__source_id = '{source_id}'"
            f" AND __collection = '{_collection}'"
        )
        if filter is not None and filter != "":
            _filter += f" AND ({filter})"

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
            doc.metadata["__collection"] = collection if collection is not None and collection != "" else self.DEFAULT

        return super().add_documents(documents, namespace=self.workspace_id, **kwargs)
