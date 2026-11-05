import json
import time
from dataclasses import dataclass
from typing import Protocol

from app.domain.ports.llm_provider import LLMProvider, LLMResponse


@dataclass
class WritingEvaluation:
    """Result of writing evaluation."""
    overall_score: float
    grammar_score: float
    vocabulary_score: float
    coherence_score: float
    argumentation_score: float
    structure_score: float
    feedback_summary: str
    inline_corrections: list[dict]
    suggestions: list[str]
    model_used: str
    tokens_used: int


@dataclass
class Exercise:
    """Generated exercise."""
    exercise_type: str
    content: dict
    correct_answer: dict
    explanation: str
    difficulty: int
    topic: str
    skill: str


class ProviderRouter:
    """Routes tasks to appropriate LLM providers based on quality/cost requirements."""

    TASK_ROUTING = {
        # Premium tasks: need best quality
        "writing_evaluation": "premium",
        "speaking_evaluation": "premium",
        "error_categorization": "premium",

        # Standard tasks: good quality, lower cost
        "daily_planning": "standard",
        "exercise_generation": "standard",
        "question_answering": "standard",

        # Local tasks: free, fast
        "flashcard_generation": "local",
        "progress_summary": "local",
        "translation": "local",
        "simple_classification": "local",

        # No LLM needed
        "grammar_check": "rule_engine",
        "fluency_detection": "signal_processing",
        "spaced_repetition": "algorithm",
    }

    def __init__(self, providers: dict[str, LLMProvider]):
        self.providers = providers

    def get_provider(self, task: str, preference: str | None = None) -> LLMProvider | None:
        """Get the appropriate provider for a task."""
        if preference and preference in self.providers:
            return self.providers[preference]

        tier = self.TASK_ROUTING.get(task, "standard")

        if tier in ("rule_engine", "signal_processing", "algorithm"):
            return None

        return self._resolve_provider(tier)

    def _resolve_provider(self, tier: str) -> LLMProvider:
        tier_mapping = {
            "premium": ["openai_gpt4o", "claude_sonnet"],
            "standard": ["openai_gpt4o_mini", "claude_haiku", "deepseek"],
            "local": ["local_qwen", "local_gemma"],
        }
        providers = tier_mapping.get(tier, ["local_qwen"])
        for provider_name in providers:
            if provider_name in self.providers:
                return self.providers[provider_name]
        raise ValueError(f"No provider available for tier: {tier}")


class AIEngine:
    """Unified interface for all AI operations in Amookht."""

    def __init__(self, router: ProviderRouter):
        self.router = router

    async def evaluate_writing(
        self,
        text: str,
        topic: str,
        level: str,
        rubric: dict[str, int],
    ) -> WritingEvaluation:
        """Evaluate a writing submission using LLM."""
        provider = self.router.get_provider("writing_evaluation")
        if provider is None:
            raise ValueError("No LLM provider available for writing evaluation")

        prompt = self._build_writing_prompt(text, topic, level, rubric)

        response = await provider.generate(
            messages=[
                {"role": "system", "content": WRITING_EVALUATION_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=2000,
        )

        return self._parse_writing_evaluation(response)

    async def generate_exercise(
        self,
        exercise_type: str,
        topic: str,
        skill: str,
        level: int,
        count: int = 1,
    ) -> list[Exercise]:
        """Generate practice exercises."""
        provider = self.router.get_provider("exercise_generation")
        if provider is None:
            raise ValueError("No LLM provider available for exercise generation")

        prompt = f"""Generate {count} {exercise_type} exercise(s) for German learning.
Topic: {topic}
Skill: {skill}
Difficulty level: {level}/10

Return JSON array of exercises with: content, correct_answer, explanation"""

        response = await provider.generate(
            messages=[
                {"role": "system", "content": "You are a German language exercise generator. Respond with valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=2000,
        )

        return self._parse_exercises(response)

    async def generate_flashcard(
        self,
        word: str,
        context: str | None = None,
        target_language: str = "en",
    ) -> dict:
        """Generate a vocabulary flashcard."""
        provider = self.router.get_provider("flashcard_generation")
        if provider is None:
            # Fallback to any available provider
            provider = self.router.get_provider("exercise_generation")
        if provider is None:
            raise ValueError("No LLM provider available")

        prompt = f"""Generate a flashcard for the German word: {word}
{f'Context: {context}' if context else ''}

Return JSON with: word, translation, definition, example_sentence, example_translation, part_of_speech"""

        response = await provider.generate(
            messages=[
                {"role": "system", "content": "You are a German vocabulary assistant. Respond with valid JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.5,
            max_tokens=500,
        )

        return json.loads(response.content)

    async def answer_question(self, question: str, context: dict) -> str:
        """Answer a learner's question."""
        provider = self.router.get_provider("question_answering")
        if provider is None:
            raise ValueError("No LLM provider available")

        response = await provider.generate(
            messages=[
                {"role": "system", "content": "You are a helpful German language tutor. Answer in simple German with explanations."},
                {"role": "user", "content": f"Question: {question}\nContext: {json.dumps(context)}"},
            ],
            temperature=0.5,
            max_tokens=1000,
        )

        return response.content

    def _build_writing_prompt(self, text: str, topic: str, level: str, rubric: dict[str, int]) -> str:
        rubric_str = "\n".join([f"- {k}: {v} points" for k, v in rubric.items()])
        return f"""Evaluate this German writing submission.

User Level: {level}
Topic: {topic}

Rubric:
{rubric_str}

User's Writing:
{text}

Provide evaluation as JSON with: overall_score, grammar_score, vocabulary_score, coherence_score,
argumentation_score, structure_score, feedback_summary, inline_corrections (array), suggestions (array)"""

    def _parse_writing_evaluation(self, response: LLMResponse) -> WritingEvaluation:
        try:
            data = json.loads(response.content)
            return WritingEvaluation(
                overall_score=data.get("overall_score", 0),
                grammar_score=data.get("grammar_score", 0),
                vocabulary_score=data.get("vocabulary_score", 0),
                coherence_score=data.get("coherence_score", 0),
                argumentation_score=data.get("argumentation_score", 0),
                structure_score=data.get("structure_score", 0),
                feedback_summary=data.get("feedback_summary", ""),
                inline_corrections=data.get("inline_corrections", []),
                suggestions=data.get("suggestions", []),
                model_used=response.model,
                tokens_used=response.total_tokens,
            )
        except (json.JSONDecodeError, KeyError):
            # Fallback: return basic evaluation
            return WritingEvaluation(
                overall_score=0,
                grammar_score=0,
                vocabulary_score=0,
                coherence_score=0,
                argumentation_score=0,
                structure_score=0,
                feedback_summary="Evaluation parsing failed. Please try again.",
                inline_corrections=[],
                suggestions=[],
                model_used=response.model,
                tokens_used=response.total_tokens,
            )

    def _parse_exercises(self, response: LLMResponse) -> list[Exercise]:
        try:
            data = json.loads(response.content)
            if isinstance(data, list):
                return [
                    Exercise(
                        exercise_type=ex.get("type", "grammar"),
                        content=ex.get("content", {}),
                        correct_answer=ex.get("correct_answer", {}),
                        explanation=ex.get("explanation", ""),
                        difficulty=ex.get("difficulty", 5),
                        topic=ex.get("topic", ""),
                        skill=ex.get("skill", ""),
                    )
                    for ex in data
                ]
        except (json.JSONDecodeError, KeyError):
            pass
        return []


WRITING_EVALUATION_SYSTEM_PROMPT = """You are an expert German language examiner for the TestDaF exam.
You evaluate writing submissions with precision and provide actionable feedback.

## Evaluation Rules
- Be encouraging but honest
- Focus on the most impactful improvements
- Use simple German for feedback (matching user's level)
- Grammar errors are more critical than style issues
- Always correct: Artikel, Präpositionen, Fall marking, Verb position

## Output Format
Respond with valid JSON matching the requested schema.
"""
