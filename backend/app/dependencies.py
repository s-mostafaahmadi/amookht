"""
Dependency injection container for Amookht.

This module wires together all dependencies and provides them to FastAPI routes.
"""

from functools import lru_cache

from app.config import get_settings
from app.domain.ports.llm_provider import LLMProvider
from app.infrastructure.ai.adapters.openai_adapter import OpenAIAdapter
from app.infrastructure.ai.adapters.anthropic_adapter import AnthropicAdapter
from app.infrastructure.ai.adapters.local_adapter import LocalLLMAdapter
from app.ai_engine.engine import AIEngine, ProviderRouter


@lru_cache()
def get_ai_engine() -> AIEngine:
    """Create and cache the AI engine with all providers."""
    settings = get_settings()

    providers: dict[str, LLMProvider] = {}

    # OpenAI
    if settings.OPENAI_API_KEY:
        providers["openai_gpt4o"] = OpenAIAdapter(
            api_key=settings.OPENAI_API_KEY,
            model=settings.OPENAI_MODEL,
        )

    # Anthropic
    if settings.ANTHROPIC_API_KEY:
        providers["claude_sonnet"] = AnthropicAdapter(
            api_key=settings.ANTHROPIC_API_KEY,
            model=settings.ANTHROPIC_MODEL,
        )

    # Local LLM (Ollama)
    try:
        providers["local_qwen"] = LocalLLMAdapter(
            base_url=settings.OLLAMA_BASE_URL,
            model=settings.OLLAMA_MODEL,
        )
    except Exception:
        pass  # Ollama might not be running

    router = ProviderRouter(providers)
    return AIEngine(router)
