from dataclasses import dataclass
from datetime import date, datetime
from enum import Enum


class ErrorType(str, Enum):
    GRAMMAR = "grammar"
    VOCABULARY = "vocabulary"
    SPELLING = "spelling"
    STYLE = "style"
    COHERENCE = "coherence"
    ARGUMENTATION = "argumentation"
    PRONUNCIATION = "pronunciation"
    FLUENCY = "fluency"


class ErrorSource(str, Enum):
    EXERCISE = "exercise"
    WRITING = "writing"
    SPEAKING = "speaking"
    MANUAL = "manual"


@dataclass
class ErrorExtraction:
    """A single extracted error."""
    error_type: ErrorType
    error_category: str
    error_subcategory: str | None
    user_answer: str
    correct_answer: str
    explanation: str
    context: str | None
    severity: float


@dataclass
class ErrorAnalysis:
    """Analysis of user's error patterns."""
    total_errors: int
    resolved_count: int
    pending_count: int
    resolution_rate: float
    top_categories: list[dict]
    error_trend: dict  # {"last_7_days": {"new": N, "resolved": M}}
    recurring_patterns: list[dict]


class ErrorMemoryService:
    """
    Manages error tracking, analysis, and resolution detection.

    This service does NOT interact with the database directly.
    It receives data and returns results. The repository layer handles persistence.
    """

    RESOLUTION_THRESHOLD = 3  # Consecutive correct uses to mark as resolved

    def categorize_error(
        self,
        error_type: ErrorType,
        user_answer: str,
        correct_answer: str,
        context: str | None = None,
    ) -> ErrorExtraction:
        """
        Categorize and analyze a single error.

        This is a rule-based categorizer. For complex categorization,
        the LLM is used instead (see AI Engine).
        """
        category = self._detect_category(error_type, user_answer, correct_answer)
        subcategory = self._detect_subcategory(error_type, user_answer, correct_answer)
        severity = self._calculate_severity(error_type, category)

        return ErrorExtraction(
            error_type=error_type,
            error_category=category,
            error_subcategory=subcategory,
            user_answer=user_answer,
            correct_answer=correct_answer,
            explanation=self._generate_explanation(error_type, category, subcategory, user_answer, correct_answer),
            context=context,
            severity=severity,
        )

    def analyze_errors(self, errors: list[dict], resolved: list[dict]) -> ErrorAnalysis:
        """
        Analyze error patterns for a user.

        Args:
            errors: List of error records (dict format)
            resolved: List of resolved error records

        Returns:
            ErrorAnalysis with pattern detection
        """
        total = len(errors) + len(resolved)
        resolved_count = len(resolved)
        pending_count = len(errors)

        resolution_rate = (resolved_count / total * 100) if total > 0 else 0

        # Group by category
        category_counts: dict[str, int] = {}
        for error in errors:
            cat = error.get("error_category", "unknown")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        # Sort by frequency
        top_categories = sorted(
            [{"category": k, "count": v} for k, v in category_counts.items()],
            key=lambda x: x["count"],
            reverse=True,
        )[:5]

        # Detect recurring patterns
        recurring = self._detect_recurring_patterns(errors)

        return ErrorAnalysis(
            total_errors=total,
            resolved_count=resolved_count,
            pending_count=pending_count,
            resolution_rate=round(resolution_rate, 1),
            top_categories=top_categories,
            error_trend={},  # Calculated from timestamps in repository
            recurring_patterns=recurring,
        )

    def should_review_today(
        self,
        next_review_date: date,
        is_mastered: bool,
        today: date | None = None,
    ) -> bool:
        """Check if an error/vocabulary item is due for review today."""
        if today is None:
            today = date.today()
        return not is_mastered and next_review_date <= today

    def _detect_category(
        self,
        error_type: ErrorType,
        user_answer: str,
        correct_answer: str,
    ) -> str:
        """Detect the specific error category using rules."""
        if error_type == ErrorType.GRAMMAR:
            return self._categorize_grammar_error(user_answer, correct_answer)
        elif error_type == ErrorType.VOCABULARY:
            return "Wortwahl"
        elif error_type == ErrorType.STYLE:
            return "Stil"
        elif error_type == ErrorType.COHERENCE:
            return "Kohärenz"
        elif error_type == ErrorType.ARGUMENTATION:
            return "Argumentation"
        return "Sonstiges"

    def _categorize_grammar_error(self, user_answer: str, correct_answer: str) -> str:
        """Categorize grammar errors using pattern matching."""
        # Article errors
        articles = {"der", "die", "das", "den", "dem", "des", "ein", "eine", "einem", "einen", "einer"}
        user_words = set(user_answer.lower().split())
        correct_words = set(correct_answer.lower().split())

        # A shared preposition with a changed governed case (for example
        # "wegen dem" -> "wegen des") is a preposition/case error, not a
        # generic article error.
        prepositions = {"wegen", "trotz", "während", "statt", "bei", "mit", "nach", "von", "zu", "für", "durch", "gegen", "ohne"}
        shared_prepositions = user_words & correct_words & prepositions
        if shared_prepositions and user_answer.lower() != correct_answer.lower():
            return "Präpositionen"
        if user_words & prepositions != correct_words & prepositions:
            return "Präpositionen"

        if user_words & articles != correct_words & articles:
            return "Artikel"

        # Default grammar categories
        return "Satzbau"

    def _detect_subcategory(
        self,
        error_type: ErrorType,
        user_answer: str,
        correct_answer: str,
    ) -> str | None:
        """Detect subcategory within a category."""
        if error_type == ErrorType.GRAMMAR:
            # Check for specific article case errors
            if "wegen" in user_answer.lower():
                return "Genitiv nach Präposition"
            if "der" in user_answer.lower() and "die" in correct_answer.lower():
                return "Genus"
        return None

    def _calculate_severity(self, error_type: ErrorType, category: str) -> float:
        """Calculate error severity (0-1, higher = more severe)."""
        base_severity = {
            ErrorType.GRAMMAR: 1.0,
            ErrorType.VOCABULARY: 0.8,
            ErrorType.SPELLING: 0.6,
            ErrorType.STYLE: 0.5,
            ErrorType.COHERENCE: 0.7,
            ErrorType.ARGUMENTATION: 0.7,
            ErrorType.PRONUNCIATION: 0.4,
            ErrorType.FLUENCY: 0.3,
        }

        severity = base_severity.get(error_type, 0.5)

        # Increase severity for fundamental errors
        if category in ("Artikel", "Präpositionen", "Satzbau"):
            severity = min(1.0, severity + 0.1)

        return severity

    def _generate_explanation(
        self,
        error_type: ErrorType,
        category: str,
        subcategory: str | None,
        user_answer: str,
        correct_answer: str,
    ) -> str:
        """Generate a human-readable explanation of the error."""
        if error_type == ErrorType.GRAMMAR:
            if category == "Artikel":
                return f"Der richtige Artikel ist '{correct_answer}'. Achten Sie auf den Kasus."
            elif category == "Präpositionen":
                return f"Die Präposition verlangt einen bestimmten Kasus. Korrekt: '{correct_answer}'."
            else:
                return f"Die Satzstruktur ist falsch. Korrekt: '{correct_answer}'."
        elif error_type == ErrorType.VOCABULARY:
            return f"Das richtige Wort ist '{correct_answer}'."
        return f"Korrektur: '{correct_answer}'"

    def _detect_recurring_patterns(self, errors: list[dict]) -> list[dict]:
        """Detect patterns that repeat across errors."""
        patterns = []

        # Group by category
        category_errors: dict[str, list] = {}
        for error in errors:
            cat = error.get("error_category", "unknown")
            if cat not in category_errors:
                category_errors[cat] = []
            category_errors[cat].append(error)

        # Find categories with 3+ errors
        for category, cat_errors in category_errors.items():
            if len(cat_errors) >= 3:
                patterns.append({
                    "category": category,
                    "count": len(cat_errors),
                    "description": f"Häufiger Fehler in '{category}' — braucht mehr Übung.",
                })

        return patterns
