from app.domain.services.skill_assessment import SkillAssessmentEngine


class TestSkillAssessmentEngine:
    def setup_method(self):
        self.engine = SkillAssessmentEngine()

    def test_level_up_on_high_accuracy(self):
        result = self.engine.calculate(
            current_level=5,
            correct_count=15,
            incorrect_count=2,
        )
        assert result.new_level == 6
        assert result.level_changed is True
        assert result.accuracy > 80

    def test_no_level_up_on_low_accuracy(self):
        result = self.engine.calculate(
            current_level=5,
            correct_count=5,
            incorrect_count=5,
        )
        assert result.new_level == 5
        assert result.level_changed is False

    def test_no_level_up_at_max_level(self):
        result = self.engine.calculate(
            current_level=10,
            correct_count=20,
            incorrect_count=0,
        )
        assert result.new_level == 10
        assert result.level_changed is False

    def test_level_down_on_very_low_accuracy(self):
        result = self.engine.calculate(
            current_level=5,
            correct_count=3,
            incorrect_count=17,
        )
        assert result.new_level == 4
        assert result.level_changed is True

    def test_no_level_down_at_min_level(self):
        result = self.engine.calculate(
            current_level=1,
            correct_count=0,
            incorrect_count=20,
        )
        assert result.new_level == 1
        assert result.level_changed is False

    def test_no_level_change_on_medium_accuracy(self):
        result = self.engine.calculate(
            current_level=5,
            correct_count=10,
            incorrect_count=10,
        )
        assert result.new_level == 5
        assert result.level_changed is False

    def test_accuracy_calculation(self):
        result = self.engine.calculate(
            current_level=5,
            correct_count=7,
            incorrect_count=3,
        )
        assert result.accuracy == 70.0

    def test_experience_calculation(self):
        result = self.engine.calculate(
            current_level=5,
            correct_count=10,
            incorrect_count=5,
        )
        assert result.new_experience == 100  # 10 * 10

    def test_zero_exercises(self):
        result = self.engine.calculate(
            current_level=5,
            correct_count=0,
            incorrect_count=0,
        )
        assert result.new_level == 5
        assert result.accuracy == 0.0
