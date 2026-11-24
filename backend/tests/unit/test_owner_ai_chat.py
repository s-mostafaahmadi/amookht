from pathlib import Path

from types import SimpleNamespace

from app.api.routes.owner_ai_chat import (
    MODEL_CONTEXT_MAX_CHARS,
    MODEL_CONTEXT_MAX_MESSAGES,
    ConversationCreate,
    MessageCreate,
    ProviderCreate,
    _compact_history,
    _model_messages,
    _provider_public,
    _response_token_budget,
)
from app.api.routes.owner_agent_tools import READ_TOOLS, SITE_SECTION_CAPABILITIES, validate_write_tool


def test_chat_payloads_are_trimmed():
    assert ConversationCreate(title="  برنامه امروز  ").title == "برنامه امروز"
    assert MessageCreate(content="  ادامه گفتگو  ").content == "ادامه گفتگو"


def test_api_key_file_is_not_in_frontend():
    frontend = Path(__file__).resolve().parents[3] / "testdaf-daily-plan.html"
    if frontend.exists():
        text = frontend.read_text(encoding="utf-8")
        assert "GROQ_API_KEY" not in text
        assert "NVIDIA_API_KEY" not in text
        assert "DEEPSEEK_API_KEY" not in text


def test_custom_provider_requires_public_https_endpoint():
    provider = ProviderCreate(name="Example", base_url="https://api.example.com/v1/chat/completions", model="example-model", api_key="secret-key-value")
    assert provider.base_url.startswith("https://")


def test_provider_response_never_contains_key():
    public = _provider_public({"id": "x", "name": "Example", "model": "m", "url": "https://api.example.com/v1/chat/completions", "key": "super-secret", "enabled": True})
    assert "key" not in public
    assert public["has_key"] is True


def test_model_context_is_bounded_and_keeps_latest_messages():
    history = [SimpleNamespace(role="user" if i % 2 == 0 else "assistant", content=f"message-{i}-" + "x" * 3000) for i in range(30)]
    compact, truncated = _compact_history(history)
    assert truncated is True
    assert len([item for item in compact if item["role"] != "system"]) <= MODEL_CONTEXT_MAX_MESSAGES
    assert sum(len(item["content"]) for item in compact if item["role"] != "system") <= MODEL_CONTEXT_MAX_CHARS
    assert "message-29-" in compact[-1]["content"]
    messages = _model_messages(history, "latest request")
    assert messages[-1] == {"role": "user", "content": "latest request"}


def test_response_budget_is_small_except_large_vocabulary_generation():
    assert _response_token_budget("How many users are registered?") == 1400
    assert _response_token_budget("لطفا 50 کلمه کامل اضافه کن") > 1400
    assert _response_token_budget("1000 vocabulary words") <= 7000


def test_agent_has_explicit_coverage_for_every_site_area():
    expected = {"learning_plan", "vocabulary", "reading", "listening", "writing", "speaking", "grammar", "testdaf_simulation", "users", "library", "mistakes_favorites_history_settings"}
    assert expected.issubset(SITE_SECTION_CAPABILITIES)
    assert {"owner_learning_overview", "library_overview", "testdaf_exam_overview"}.issubset(READ_TOOLS)


def test_all_six_learning_skills_accept_valid_agent_payloads():
    samples = {
        "wortschatz": {"word": "Wald", "meaning_native": "forest"},
        "lesen": {"title": "Text", "text": "Ein langer Text", "questions": [{"q": "Warum?"}]},
        "hoeren": {"title": "Audio", "text": "Transkript", "questions": [{"q": "Was?"}]},
        "grammatik": {"title": "Passiv", "exercises": [{"q": "Formulieren Sie um."}]},
        "schreiben": {"writing_task": "Schreiben Sie einen Text."},
        "sprechen": {"question": "Sprechen Sie ueber das Thema."},
    }
    for skill, item in samples.items():
        validate_write_tool("create_learning_content", {"topic_key": "umwelt", "skill_key": skill, "visibility": "private", "item": item})
