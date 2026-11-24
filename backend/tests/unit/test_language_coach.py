from types import SimpleNamespace

from app.api.routes.language_coach import (
    COACH_CONTEXT_CHARS,
    COACH_CONTEXT_MESSAGES,
    COACH_KIND,
    MessageCreate,
    ProviderPreference,
    _coach_context,
    _parse_coach_response,
)


def test_coach_response_parses_correction_and_reply():
    result = _parse_coach_response('{"grammar_ok":false,"grammar_correction":"Ich gehe nach Hause.","grammar_explanation":"Verb correction","natural_ok":false,"natural_version":"Ich gehe heim.","natural_explanation":"More common","reply":"Was machst du dort?"}')
    assert result["grammar_ok"] is False
    assert result["grammar_correction"] == "Ich gehe nach Hause."
    assert result["natural_ok"] is False
    assert result["natural_version"] == "Ich gehe heim."
    assert result["reply"] == "Was machst du dort?"


def test_coach_response_falls_back_to_short_plain_reply():
    result = _parse_coach_response("Gern! Was hast du heute gemacht?")
    assert result["grammar_ok"] is True
    assert result["natural_ok"] is True
    assert result["reply"].startswith("Gern!")


def test_coach_context_is_small_and_keeps_recent_messages():
    history = [SimpleNamespace(role="user" if i % 2 == 0 else "assistant", content=f"turn-{i}-" + "x" * 2500) for i in range(20)]
    messages = _coach_context(history, "fa")
    context = messages[1:]
    assert len(context) <= COACH_CONTEXT_MESSAGES
    assert sum(len(item["content"]) for item in context) <= COACH_CONTEXT_CHARS
    assert "turn-19-" in context[-1]["content"]
    assert "UI_LANGUAGE=fa" in messages[0]["content"]


def test_coach_message_is_trimmed_and_kind_is_separate():
    assert MessageCreate(content="  Guten Tag  ").content == "Guten Tag"
    assert ProviderPreference(provider_id="nvidia").provider_id == "nvidia"
    assert ProviderPreference(provider_id=None).provider_id is None
    assert COACH_KIND != "owner"
