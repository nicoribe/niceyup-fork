from typing import Optional
from embeddings import Embeddings
from llm import LLM
from vector_store import VectorStore

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

    def _get_prompt(self):
        return """
        You are a helpful assistant!
        """
