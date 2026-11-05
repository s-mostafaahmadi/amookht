from dataclasses import dataclass


@dataclass
class SkillAssessmentResult:
    """Result of skill level assessment."""
    new_level: int
    new_experience: int
    level_changed: bool
    accuracy: float


class SkillAssessmentEngine:
    """
    Calculates skill levels based on performance data.

    Level progression rules:
    - Level increases when accuracy > 80% AND correct_count >= 10 since last level
    - Level decreases when accuracy < 40% over last 20 exercises
    - Maximum level: 10
    - Minimum level: 1
    """

    LEVEL_UP_THRESHOLD = 0.80
    LEVEL_DOWN_THRESHOLD = 0.40
    MIN_EXERCISES_FOR_LEVEL_UP = 10
    MIN_EXERCISES_FOR_LEVEL_DOWN = 20
    EXPERIENCE_PER_CORRECT = 10
    EXPERIENCE_PER_LEVEL = 100

    def calculate(
        self,
        current_level: int,
        correct_count: int,
        incorrect_count: int,
        total_practice_seconds: int = 0,
    ) -> SkillAssessmentResult:
        """
        Calculate new skill level based on performance.

        Args:
            current_level: Current skill level (1-10)
            correct_count: Total correct answers
            incorrect_count: Total incorrect answers
            total_practice_seconds: Total time spent practicing

        Returns:
            SkillAssessmentResult with updated level
        """
        total = correct_count + incorrect_count
        if total == 0:
            return SkillAssessmentResult(
                new_level=current_level,
                new_experience=0,
                level_changed=False,
                accuracy=0.0,
            )

        accuracy = correct_count / total
        experience = correct_count * self.EXPERIENCE_PER_CORRECT

        new_level = current_level
        level_changed = False

        # Check for level up
        if (
            accuracy >= self.LEVEL_UP_THRESHOLD
            and total >= self.MIN_EXERCISES_FOR_LEVEL_UP
            and current_level < 10
        ):
            new_level = min(10, current_level + 1)
            level_changed = True

        # Check for level down (only if not just leveled up)
        elif (
            accuracy < self.LEVEL_DOWN_THRESHOLD
            and total >= self.MIN_EXERCISES_FOR_LEVEL_DOWN
            and current_level > 1
        ):
            new_level = max(1, current_level - 1)
            level_changed = True

        return SkillAssessmentResult(
            new_level=new_level,
            new_experience=experience,
            level_changed=level_changed,
            accuracy=round(accuracy * 100, 1),
        )

    def calculate_sub_skill_level(
        self,
        parent_level: int,
        sub_skill_correct: int,
        sub_skill_incorrect: int,
    ) -> SkillAssessmentResult:
        """
        Calculate sub-skill level based on parent level and specific performance.

        Sub-skills are influenced by parent skill level but can vary.
        """
        result = self.calculate(
            current_level=parent_level,
            correct_count=sub_skill_correct,
            incorrect_count=sub_skill_incorrect,
        )

        # Sub-skill cannot exceed parent level + 2
        max_sub_level = min(10, parent_level + 2)
        result.new_level = min(result.new_level, max_sub_level)

        # Sub-skill cannot be less than parent level - 2
        min_sub_level = max(1, parent_level - 2)
        result.new_level = max(result.new_level, min_sub_level)

        return result
