"""Small dependency-free runner for production TestDaF exam validation checks."""

from tests.unit.test_testdaf_exams import (
    test_reject_incomplete_reading_exam,
    test_validate_complete_exam,
)


if __name__ == "__main__":
    test_validate_complete_exam()
    test_reject_incomplete_reading_exam()
    print("VALIDATOR_TESTS_OK")
