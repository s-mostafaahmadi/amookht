from datetime import date, timedelta

from app.domain.services.spaced_repetition import SpacedRepetitionEngine, ReviewQuality


class TestSpacedRepetitionEngine:
    def setup_method(self):
        self.engine = SpacedRepetitionEngine()
        self.today = date(2026, 7, 23)

    def test_first_correct_review(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=1,
            current_repetitions=0,
            quality=ReviewQuality.EASY,
            today=self.today,
        )
        assert result.interval_days == 1  # First interval
        assert result.ease_factor > 2.5
        assert result.repetitions == 1
        assert not result.is_mastered

    def test_second_correct_review(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=1,
            current_repetitions=1,
            quality=ReviewQuality.EASY,
            today=self.today,
        )
        assert result.interval_days == 3  # Second interval
        assert result.repetitions == 2

    def test_third_correct_review(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=3,
            current_repetitions=2,
            quality=ReviewQuality.EASY,
            today=self.today,
        )
        assert result.interval_days == 7  # Third interval
        assert result.repetitions == 3

    def test_fourth_correct_review_uses_ease(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=7,
            current_repetitions=3,
            quality=ReviewQuality.EASY,
            today=self.today,
        )
        # After initial intervals, uses ease factor: 7 * 2.5 = 17.5 ≈ 18
        assert result.interval_days == 18
        assert result.repetitions == 4

    def test_failed_review_resets(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=15,
            current_repetitions=5,
            quality=ReviewQuality.INCORRECT,
            today=self.today,
        )
        assert result.interval_days == 1
        assert result.repetitions == 0
        assert result.ease_factor < 2.5

    def test_hard_review_decreases_ease(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=7,
            current_repetitions=3,
            quality=ReviewQuality.HARD,
            today=self.today,
        )
        assert result.ease_factor < 2.5
        assert result.interval_days > 0

    def test_perfect_review_increases_ease(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=7,
            current_repetitions=3,
            quality=ReviewQuality.PERFECT,
            today=self.today,
        )
        assert result.ease_factor > 2.5

    def test_mastery_detection(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=50,
            current_repetitions=10,
            quality=ReviewQuality.EASY,
            today=self.today,
        )
        # 50 * 2.5 = 125, which is > 60 threshold
        assert result.is_mastered is True

    def test_no_mastery_below_threshold(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=10,
            current_repetitions=4,
            quality=ReviewQuality.EASY,
            today=self.today,
        )
        assert result.is_mastered is False

    def test_ease_factor_minimum(self):
        # Many failed reviews should not drop ease below 1.3
        result = self.engine.calculate_next_review(
            current_ease=1.3,
            current_interval=1,
            current_repetitions=0,
            quality=ReviewQuality.BLACKOUT,
            today=self.today,
        )
        assert result.ease_factor >= 1.3

    def test_next_review_date(self):
        result = self.engine.calculate_next_review(
            current_ease=2.5,
            current_interval=7,
            current_repetitions=3,
            quality=ReviewQuality.EASY,
            today=self.today,
        )
        expected_date = self.today + timedelta(days=18)
        assert result.next_review_date == expected_date

    def test_initial_state(self):
        result = self.engine.calculate_initial_state()
        assert result.ease_factor == 2.5
        assert result.interval_days == 1
        assert result.repetitions == 0
        assert not result.is_mastered
