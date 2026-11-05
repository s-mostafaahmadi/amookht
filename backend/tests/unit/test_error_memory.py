from datetime import date

from app.domain.services.error_memory import (
    ErrorMemoryService,
    ErrorType,
    ErrorSource,
)


class TestErrorMemoryService:
    def setup_method(self):
        self.service = ErrorMemoryService()

    def test_categorize_grammar_article_error(self):
        result = self.service.categorize_error(
            error_type=ErrorType.GRAMMAR,
            user_answer="der Hund",
            correct_answer="die Hund",
        )
        assert result.error_type == ErrorType.GRAMMAR
        assert result.error_category == "Artikel"
        assert result.severity > 0

    def test_categorize_preposition_error(self):
        result = self.service.categorize_error(
            error_type=ErrorType.GRAMMAR,
            user_answer="wegen dem Wetter",
            correct_answer="wegen des Wetters",
        )
        assert result.error_category == "Präpositionen"

    def test_categorize_vocabulary_error(self):
        result = self.service.categorize_error(
            error_type=ErrorType.VOCABULARY,
            user_answer="groß",
            correct_answer="bedeutend",
        )
        assert result.error_type == ErrorType.VOCABULARY
        assert result.error_category == "Wortwahl"

    def test_severity_grammar_higher_than_style(self):
        grammar = self.service.categorize_error(
            error_type=ErrorType.GRAMMAR,
            user_answer="der",
            correct_answer="die",
        )
        style = self.service.categorize_error(
            error_type=ErrorType.STYLE,
            user_answer="gut",
            correct_answer="ausgezeichnet",
        )
        assert grammar.severity > style.severity

    def test_should_review_today(self):
        today = date(2026, 7, 23)
        assert self.service.should_review_today(
            next_review_date=date(2026, 7, 23),
            is_mastered=False,
            today=today,
        ) is True

    def test_should_not_review_if_mastered(self):
        today = date(2026, 7, 23)
        assert self.service.should_review_today(
            next_review_date=date(2026, 7, 23),
            is_mastered=True,
            today=today,
        ) is False

    def test_should_not_review_if_future(self):
        today = date(2026, 7, 23)
        assert self.service.should_review_today(
            next_review_date=date(2026, 7, 25),
            is_mastered=False,
            today=today,
        ) is False

    def test_analyze_errors(self):
        errors = [
            {"error_category": "Artikel", "is_resolved": False},
            {"error_category": "Artikel", "is_resolved": False},
            {"error_category": "Präpositionen", "is_resolved": False},
        ]
        resolved = [
            {"error_category": "Artikel", "is_resolved": True},
        ]
        result = self.service.analyze_errors(errors, resolved)
        assert result.total_errors == 4
        assert result.resolved_count == 1
        assert result.pending_count == 3
        assert result.resolution_rate == 25.0

    def test_detect_recurring_patterns(self):
        errors = [
            {"error_category": "Artikel"},
            {"error_category": "Artikel"},
            {"error_category": "Artikel"},
            {"error_category": "Präpositionen"},
        ]
        patterns = self.service._detect_recurring_patterns(errors)
        assert len(patterns) == 1
        assert patterns[0]["category"] == "Artikel"
        assert patterns[0]["count"] == 3
