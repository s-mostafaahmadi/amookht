import time
from openai import AsyncOpenAI

from app.domain.ports.llm_provider import LLMProvider, LLMResponse


class OpenAIAdapter(LLMProvider):
    """OpenAI API adapter."""

    def __init__(self, api_key: str, model: str = "gpt-4o"):
        self.client = AsyncOpenAI(api_key=api_key)
        self._model = model

    async def generate(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs,
    ) -> LLMResponse:
        start = time.monotonic()

        response = await self.client.chat.completions.create(
            model=self._model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

        latency_ms = int((time.monotonic() - start) * 1000)
        choice = response.choices[0]

        return LLMResponse(
            content=choice.message.content or "",
            model=response.model,
            provider="openai",
            input_tokens=response.usage.prompt_tokens if response.usage else 0,
            output_tokens=response.usage.completion_tokens if response.usage else 0,
            total_tokens=response.usage.total_tokens if response.usage else 0,
            latency_ms=latency_ms,
            finish_reason=choice.finish_reason,
        )

    async def generate_structured(
        self,
        messages: list[dict],
        schema: dict,
        temperature: float = 0.3,
        **kwargs,
    ) -> dict:
        import json

        response = await self.generate(
            messages=messages + [
                {"role": "system", "content": f"Respond with valid JSON matching this schema: {json.dumps(schema)}"}
            ],
            temperature=temperature,
            **kwargs,
        )

        return json.loads(response.content)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        response = await self.client.embeddings.create(
            model="text-embedding-3-small",
            input=texts,
        )
        return [item.embedding for item in response.data]

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def provider_name(self) -> str:
        return "openai"

    @property
    def max_context_length(self) -> int:
        return 128_000

    @property
    def cost_per_1k_input_tokens(self) -> float:
        return 0.0025

    @property
    def cost_per_1k_output_tokens(self) -> float:
        return 0.01
