"""Tests for preprocessing validation (Issue #3)."""

import pytest

from parsers.schemas import ParsedOption, ParsedQuestion
from parsers.validation import validate_questions


def _make_question(
    stem: str = "Wat is de hoofdstad van Nederland?",
    options: list[dict] | None = None,
    category: str | None = "Aardrijkskunde",
    question_id: str | None = None,
    bloom_level: str | None = None,
    learning_goal: str | None = None,
) -> ParsedQuestion:
    """Helper to create a valid ParsedQuestion with sensible defaults."""
    if options is None:
        options = [
            {"text": "Amsterdam", "position": 0, "is_correct": True},
            {"text": "Rotterdam", "position": 1, "is_correct": False},
            {"text": "Den Haag", "position": 2, "is_correct": False},
            {"text": "Utrecht", "position": 3, "is_correct": False},
        ]
    return ParsedQuestion(
        stem=stem,
        options=[ParsedOption(**o) for o in options],
        question_id=question_id,
        category=category,
        bloom_level=bloom_level,
        learning_goal=learning_goal,
    )


class TestValidateQuestions:
    """Tests for the validate_questions function."""

    def test_all_valid(self):
        """All valid questions should produce is_valid=True."""
        questions = [
            _make_question(question_id="1"),
            _make_question(stem="Andere vraag?", question_id="2"),
        ]
        result = validate_questions(questions)
        assert result.is_valid is True
        assert result.valid_count == 2
        assert result.invalid_count == 0
        assert all(r.is_valid for r in result.results)

    def test_empty_stem(self):
        """Empty stem should produce an error."""
        questions = [_make_question(stem="")]
        result = validate_questions(questions)
        assert result.is_valid is False
        errors = result.results[0].errors
        assert any(e.code == "empty_stem" for e in errors)

    def test_whitespace_only_stem(self):
        """Whitespace-only stem should produce an error."""
        questions = [_make_question(stem="   ")]
        result = validate_questions(questions)
        assert result.is_valid is False
        assert any(e.code == "empty_stem" for e in result.results[0].errors)

    def test_too_few_options(self):
        """Fewer than 2 options should produce an error."""
        questions = [
            _make_question(
                options=[{"text": "Enige optie", "position": 0, "is_correct": True}]
            )
        ]
        result = validate_questions(questions)
        assert result.is_valid is False
        assert any(e.code == "too_few_options" for e in result.results[0].errors)

    def test_no_correct_answer(self):
        """No correct answer marked should produce an error."""
        questions = [
            _make_question(
                options=[
                    {"text": "A", "position": 0, "is_correct": False},
                    {"text": "B", "position": 1, "is_correct": False},
                    {"text": "C", "position": 2, "is_correct": False},
                ]
            )
        ]
        result = validate_questions(questions)
        assert result.is_valid is False
        assert any(e.code == "no_correct" for e in result.results[0].errors)

    def test_multiple_correct_answers(self):
        """Multiple correct answers should produce an error."""
        questions = [
            _make_question(
                options=[
                    {"text": "A", "position": 0, "is_correct": True},
                    {"text": "B", "position": 1, "is_correct": True},
                    {"text": "C", "position": 2, "is_correct": False},
                ]
            )
        ]
        result = validate_questions(questions)
        assert result.is_valid is False
        assert any(e.code == "multiple_correct" for e in result.results[0].errors)

    def test_empty_option_text(self):
        """Empty option text should produce an error."""
        questions = [
            _make_question(
                options=[
                    {"text": "A", "position": 0, "is_correct": True},
                    {"text": "", "position": 1, "is_correct": False},
                    {"text": "C", "position": 2, "is_correct": False},
                ]
            )
        ]
        result = validate_questions(questions)
        assert result.is_valid is False
        errors = result.results[0].errors
        assert any(e.code == "empty_option" for e in errors)
        assert any("Optie B" in e.message for e in errors)

    def test_empty_category(self):
        """Missing category should produce an error."""
        questions = [_make_question(category=None)]
        result = validate_questions(questions)
        assert result.is_valid is False
        assert any(e.code == "empty_category" for e in result.results[0].errors)

    def test_whitespace_category(self):
        """Whitespace-only category should produce an error."""
        questions = [_make_question(category="   ")]
        result = validate_questions(questions)
        assert result.is_valid is False
        assert any(e.code == "empty_category" for e in result.results[0].errors)

    def test_duplicate_question_ids(self):
        """Duplicate question IDs should produce errors on both questions."""
        questions = [
            _make_question(question_id="1"),
            _make_question(stem="Andere vraag?", question_id="1"),
        ]
        result = validate_questions(questions)
        assert result.is_valid is False
        assert any(e.code == "duplicate_id" for e in result.results[0].errors)
        assert any(e.code == "duplicate_id" for e in result.results[1].errors)

    def test_auto_assigned_ids_no_duplicates(self):
        """Auto-assigned IDs (None) should not produce duplicate errors."""
        questions = [
            _make_question(question_id=None),
            _make_question(stem="Andere vraag?", question_id=None),
        ]
        result = validate_questions(questions)
        # Auto-assigned IDs are 1-based index, so "1" and "2" — no duplicates
        assert not any(
            e.code == "duplicate_id"
            for r in result.results
            for e in r.errors
        )

    def test_warning_two_options(self):
        """Exactly 2 options should produce a warning, not an error."""
        questions = [
            _make_question(
                options=[
                    {"text": "Ja", "position": 0, "is_correct": True},
                    {"text": "Nee", "position": 1, "is_correct": False},
                ]
            )
        ]
        result = validate_questions(questions)
        # Should still be valid (warnings don't block)
        assert result.results[0].is_valid is True
        assert any(w.code == "few_options" for w in result.results[0].warnings)

    def test_multiple_errors_per_question(self):
        """A question with multiple issues should report all errors."""
        questions = [
            _make_question(
                stem="",
                category=None,
                options=[
                    {"text": "", "position": 0, "is_correct": False},
                    {"text": "B", "position": 1, "is_correct": False},
                ],
            )
        ]
        result = validate_questions(questions)
        assert result.is_valid is False
        errors = result.results[0].errors
        error_codes = {e.code for e in errors}
        assert "empty_stem" in error_codes
        assert "no_correct" in error_codes
        assert "empty_option" in error_codes
        assert "empty_category" in error_codes

    def test_mixed_valid_and_invalid(self):
        """Mix of valid and invalid questions should report correct counts."""
        questions = [
            _make_question(question_id="1"),
            _make_question(stem="", question_id="2"),  # invalid
            _make_question(stem="Derde vraag?", question_id="3"),
        ]
        result = validate_questions(questions)
        assert result.is_valid is False
        assert result.total_questions == 3
        assert result.valid_count == 2
        assert result.invalid_count == 1
        assert result.results[0].is_valid is True
        assert result.results[1].is_valid is False
        assert result.results[2].is_valid is True

    def test_empty_list(self):
        """Empty question list should be valid (no errors)."""
        result = validate_questions([])
        assert result.is_valid is True
        assert result.total_questions == 0

    def test_question_id_in_result(self):
        """Question ID should be included in validation result."""
        questions = [_make_question(question_id="Q42")]
        result = validate_questions(questions)
        assert result.results[0].question_id == "Q42"

    def test_response_structure(self):
        """Validation response should have correct structure."""
        questions = [_make_question(question_id="1")]
        result = validate_questions(questions)
        assert hasattr(result, "is_valid")
        assert hasattr(result, "total_questions")
        assert hasattr(result, "valid_count")
        assert hasattr(result, "invalid_count")
        assert hasattr(result, "results")
        assert hasattr(result.results[0], "question_index")
        assert hasattr(result.results[0], "question_id")
        assert hasattr(result.results[0], "is_valid")
        assert hasattr(result.results[0], "errors")
        assert hasattr(result.results[0], "warnings")
