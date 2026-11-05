from fastapi import HTTPException

from app.api.routes.testdaf_exams import validate_exam_data


def valid_exam():
    reading_counts = [8, 10, 10, 12]
    listening_counts = [8, 8, 9, 10]
    return {
        "lesen": {
            "texts": [
                {
                    "title": f"Reading {index}",
                    "text": "Academic reading text.",
                    "questions": [
                        {"type": "mc", "q": f"Question {number}", "options": ["A", "B", "C"], "answer": 0}
                        for number in range(count)
                    ],
                }
                for index, count in enumerate(reading_counts, start=1)
            ]
        },
        "hoeren": {
            "texts": [
                {
                    "title": f"Listening {index}",
                    "text": "Academic listening transcript.",
                    "questions": [
                        {"type": "gap", "q": f"Question {number}", "answer": "Antwort"}
                        for number in range(count)
                    ],
                }
                for index, count in enumerate(listening_counts, start=1)
            ]
        },
        "schreiben": {
            "title": "Writing",
            "task": "Write about the chart.",
            "chartTitle": "Chart",
            "chart": [["2024", 50], ["2025", 60], ["2026", 70]],
            "min": 350,
            "max": 400,
            "time": 60,
        },
        "sprechen": {
            "tasks": [
                {"type": f"Task {index}", "q": "Speak about this topic.", "prep": 30, "time": 60}
                for index in range(1, 8)
            ]
        },
    }


def test_validate_complete_exam():
    assert validate_exam_data(valid_exam()) == {
        "lesen_questions": 40,
        "hoeren_questions": 35,
        "sprechen_tasks": 7,
    }


def test_reject_incomplete_reading_exam():
    exam = valid_exam()
    exam["lesen"]["texts"][0]["questions"].pop()
    try:
        validate_exam_data(exam)
    except HTTPException as error:
        assert error.status_code == 422
        assert "40 questions" in error.detail
    else:
        raise AssertionError("Incomplete TestDaF exam should be rejected")
