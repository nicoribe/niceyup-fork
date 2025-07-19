from langchain_openai import ChatOpenAI

class LLMProvider(ChatOpenAI):
    def __init__(self, model: str = "gpt-4o-mini", temperature: float = 0.7, **kwargs):
        super().__init__(model=model, temperature=temperature, streaming=True, **kwargs)
