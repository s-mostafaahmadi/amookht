import time
import httpx

from app.domain.ports.llm_provider import LLMProvider, LLMResponse


class LocalLLMAdapter(LLMProvider):
    """Ollama-based local LLM adapter."""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "qwen2.5:7b"):
        self.base_url = base_url
        self._model = model
        self.client = httpx.AsyncClient(base_url=base_url, timeout=60.0)

    async def generate(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs,
    ) -> LLMResponse:
        start = time.monotonic()

        response = await self.client.post(
            "/api/chat",
            json={
                "model": self._model,
                "messages": messages,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens,
                },
                "stream": False,
            },
        )
        response.raise_for_status()
        data = response.json()

        latency_ms = int((time.monotonic() - start) * 1000)

        # Extract token counts from Ollama response
        prompt_tokens = data.get("prompt_eval_count", 0)
        completion_tokens = data.get("eval_count", 0)

        return LLMResponse(
            content=data["message"]["content"],
            model=self._model,
            provider="local",
            input_tokens=prompt_tokens,
            output_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            latency_ms=latency_ms,
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
        embeddings = []
        for text in texts:
            response = await self.client.post(
                "/api/embeddings",
                json={
                    "model": self._model,
                    "prompt": text,
                },
            )
            response.raise_for_status()
            embeddings.append(response.json()["embedding"])
        return embeddings

    @property
    def model_name(self) -> str:
        return self._model

    @property
    def provider_name(self) -> str:
        return "local"

    @property
    def max_context_length(self) -> int:
        return 32_000  # Depends on model

    @property
    def cost_per_1k_input_tokens(self) -> float:
        return 0.0  # Free (local)

    @property
    def cost_per_1k_output_tokens(self) -> float:
        return 0.0  # Free (local)
