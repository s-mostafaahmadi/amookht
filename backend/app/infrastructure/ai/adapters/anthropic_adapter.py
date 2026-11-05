import time
from anthropic import AsyncAnthropic

from app.domain.ports.llm_provider import LLMProvider, LLMResponse


class AnthropicAdapter(LLMProvider):
    """Anthropic Claude API adapter."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-20250514"):
        self.client = AsyncAnthropic(api_key=api_key)
        self._model = model

    async def generate(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs,
    ) -> LLMResponse:
        start = time.monotonic()

        # Convert OpenAI format to Anthropic format
        system_message = ""
        anthropic_messages = []
        for msg in messages:
            if msg["role"] == "system":
                system_message = msg["content"]
            else:
                anthropic_messages.append(msg)

        response = await self.client.messages.create(
            model=self._model,
            max_tokens=max_tokens,
            temperature=temperature,
            system=system_message,
            messages=anthropic_messages,
        )

        latency_ms = int((time.monotonic() - start) * 1000)

        return LLMResponse(
            content=response.content[0].text if response.content else "",
            model=response.model,
            provider="anthropic",
            input_tokens=response.usage.input_tokens,
            output_tokens=response.usage.output_tokens,
            total_tokens=response.usage.input_tokens + response.usage.output_tokens,
            latency_ms=latency_ms,
            finish_reason=response.stop_reason,
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
                {"role": "user", "content": f"Respond with valid JSON matching this schema: {json.dumps(schema)}"}
            ],
            temperature=temperature,
            **kwargs,
        )

        return json.loads(response.content)

    async def embed(self, texts: list[str]) -> list[list[float]]:
        # Anthropic doesn't have a native embedding API
        # Use OpenAI for embeddings or a local model
        raise NotImplementedError("Anthropic does not provide embedding API. Use OpenAI or local model.")

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def provider_name(self) -> str:
        return "anthropic"

    @property
    def max_context_length(self) -> int:
        return 200_000

    @property
    def cost_per_1k_input_tokens(self) -> float:
        return 0.003

    @property
    def cost_per_1k_output_tokens(self) -> float:
        return 0.015
