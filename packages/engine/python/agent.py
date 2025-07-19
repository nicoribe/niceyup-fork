from typing import Optional
from packages.engine.python.embeddings_provider import EmbeddingsProvider
from packages.engine.python.llm_provider import LLMProvider
from packages.engine.python.vector_store_provider import VectorStoreProvider

class Agent:
    def __init__(
        self,
        llm: Optional[LLMProvider] = None,
        embeddings: Optional[EmbeddingsProvider] = None,
        vector_store: Optional[VectorStoreProvider] = None,
    ):
        self.llm = llm or LLMProvider()
        self.embeddings = embeddings or EmbeddingsProvider()
        self.vector_store = vector_store or VectorStoreProvider(embeddings=self.embeddings)

    def _get_prompt(self):
        return """
        You are a helpful assistant!
        """
