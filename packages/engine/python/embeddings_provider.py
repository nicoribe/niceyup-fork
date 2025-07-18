from langchain_openai import OpenAIEmbeddings

class EmbeddingsProvider(OpenAIEmbeddings):
    def __init__(self, model: str = "text-embedding-ada-002", **kwargs):
        super().__init__(model=model, **kwargs)
