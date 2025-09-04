from langchain_openai import OpenAIEmbeddings

class Embeddings(OpenAIEmbeddings):
    def __init__(self, model: str = "text-embedding-ada-002", **kwargs):
        super().__init__(model=model, **kwargs)
