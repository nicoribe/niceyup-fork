from typing import Optional
from source_storage import SourceStorage
from embeddings import Embeddings
from llm import LLM
from vector_store import VectorStore
from agent import Agent

class Ingestor:
    def __init__(
        self,
        source: SourceStorage,
        llm: Optional[LLM] = None,
        embeddings: Optional[Embeddings] = None,
        vector_store: Optional[VectorStore] = None,
        agent: Optional[Agent] = None,
    ):
        self.source = source
        self.llm = llm or LLM()
        self.embeddings = embeddings or Embeddings()
        self.vector_store = vector_store or VectorStore(embeddings=self.embeddings)
        self.agent = agent or Agent(llm=self.llm, embeddings=self.embeddings, vector_store=self.vector_store)

    def run(self):
        pass
