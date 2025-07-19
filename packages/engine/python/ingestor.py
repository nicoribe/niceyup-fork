from typing import Optional
from source_storage import SourceStorage
from packages.engine.python.embeddings_provider import EmbeddingsProvider
from packages.engine.python.llm_provider import LLMProvider
from packages.engine.python.vector_store_provider import VectorStoreProvider
from packages.engine.python.agent import Agent

class Ingestor:
    def __init__(
        self,
        source: SourceStorage,
        llm: Optional[LLMProvider] = None,
        embeddings: Optional[EmbeddingsProvider] = None,
        vector_store: Optional[VectorStoreProvider] = None,
        agent: Optional[Agent] = None,
    ):
        self.source = source
        self.llm = llm or LLMProvider()
        self.embeddings = embeddings or EmbeddingsProvider()
        self.vector_store = vector_store or VectorStoreProvider(embeddings=self.embeddings)
        self.agent = agent or Agent(llm=self.llm, embeddings=self.embeddings, vector_store=self.vector_store)

    def run(self):
        pass
