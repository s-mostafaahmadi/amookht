from dataclasses import dataclass
from datetime import date, timedelta
from enum import Enum


class ReviewQuality(int, Enum):
    """Quality of recall (0-5 scale, based on SM-2)."""
    BLACKOUT = 0       # No recall at all
    INCORRECT = 1      # Incorrect, but recognized when shown
    HARD = 2           # Correct, but with significant difficulty
    MEDIUM = 3         # Correct, with some hesitation
    EASY = 4           # Correct, with minor hesitation
    PERFECT = 5        # Perfect, instant recall


@dataclass
class ReviewResult:
    """Result of a spaced repetition review."""
    ease_factor: float
    interval_days: int
    repetitions: int
    next_review_date: date
    is_mastered: bool


class SpacedRepetitionEngine:
    """
    Modified SM-2 algorithm for spaced repetition.

    Based on the SuperMemo SM-2 algorithm with modifications:
    - Minimum ease factor: 1.3
    - Mastery threshold: interval > 60 days
    - Initial intervals: 1, 3, 7 days (instead of 1, 6)
    """

    MIN_EASE_FACTOR = 1.3
    MASTERY_INTERVAL_THRESHOLD = 60
    INITIAL_INTERVALS = [1, 3, 7]

    def calculate_next_review(
        self,
        current_ease: float,
        current_interval: int,
        current_repetitions: int,
        quality: ReviewQuality,
        today: date | None = None,
    ) -> ReviewResult:
        """
        Calculate the next review parameters based on quality of recall.

        Args:
            current_ease: Current ease factor (>= 1.3)
            current_interval: Current interval in days
            current_repetitions: Number of successful repetitions
            quality: Quality of recall (0-5)
            today: Reference date for calculating next review

        Returns:
            ReviewResult with updated parameters
        """
        if today is None:
            today = date.today()

        quality_value = quality.value

        if quality_value >= 3:
            # Correct response
            new_repetitions = current_repetitions + 1

            # Calculate new interval
            if new_repetitions <= len(self.INITIAL_INTERVALS):
                new_interval = self.INITIAL_INTERVALS[new_repetitions - 1]
            else:
                new_interval = round(current_interval * current_ease)

            # Keep the quality labels intuitive: EASY and PERFECT increase
            # ease, while MEDIUM reduces it slightly.
            ease_delta = {3: -0.14, 4: 0.05, 5: 0.10}[quality_value]
            new_ease = max(self.MIN_EASE_FACTOR, current_ease + ease_delta)

        else:
            # Incorrect response - reset
            new_repetitions = 0
            new_interval = 1
            new_ease = max(self.MIN_EASE_FACTOR, current_ease - 0.2)

        # Check mastery
        is_mastered = new_interval >= self.MASTERY_INTERVAL_THRESHOLD

        next_review_date = today + timedelta(days=new_interval)

        return ReviewResult(
            ease_factor=round(new_ease, 2),
            interval_days=new_interval,
            repetitions=new_repetitions,
            next_review_date=next_review_date,
            is_mastered=is_mastered,
        )

    def calculate_initial_state(self) -> ReviewResult:
        """Calculate initial state for a new item."""
        return ReviewResult(
            ease_factor=2.5,
            interval_days=1,
            repetitions=0,
            next_review_date=date.today() + timedelta(days=1),
            is_mastered=False,
        )
