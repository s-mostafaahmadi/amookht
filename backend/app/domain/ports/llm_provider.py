from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class LLMResponse:
    """Standardized response from any LLM provider."""
    content: str
    model: str
    provider: str
    input_tokens: int
    output_tokens: int
    total_tokens: int
    latency_ms: int
    finish_reason: str | None = None


class LLMProvider(ABC):
    """Abstract interface for LLM providers."""

    @abstractmethod
    async def generate(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        max_tokens: int = 2000,
        **kwargs,
    ) -> LLMResponse:
        """Generate text completion."""
        ...

    @abstractmethod
    async def generate_structured(
        self,
        messages: list[dict],
        schema: dict,
        temperature: float = 0.3,
        **kwargs,
    ) -> dict:
        """Generate structured output matching schema."""
        ...

    @abstractmethod
    async def embed(self, texts: list[str]) -> list[list[float]]:
        """Generate embeddings for texts."""
        ...

    @property
    @abstractmethod
    def model_name(self) -> str: ...

    @property
    @abstractmethod
    def provider_name(self) -> str: ...

    @property
    @abstractmethod
    def max_context_length(self) -> int: ...

    @property
    @abstractmethod
    def cost_per_1k_input_tokens(self) -> float: ...

    @property
    @abstractmethod
    def cost_per_1k_output_tokens(self) -> float: ...
