"""T6.2 & T6.3: Validation prompt builder tests."""

import pytest

from llm.prompts.validation import build_validation_prompt


SAMPLE_QUESTION = {
    "stam": "Wat is de hoofdstad van Nederland?",
    "opties": [
        {"positie": 0, "tekst": "Amsterdam", "is_correct": True},
        {"positie": 1, "tekst": "Rotterdam", "is_correct": False},
        {"positie": 2, "tekst": "Den Haag", "is_correct": False},
        {"positie": 3, "tekst": "Utrecht", "is_correct": False},
    ],
    "leerdoel": "Student kan de hoofdstad van Nederland benoemen.",
}

SAMPLE_DET_RESULTS = {
    "tech_kwant_longest_bias": False,
    "tech_kwant_homogeneity_score": 0.95,
    "tech_kwant_absolute_terms_correct": [],
    "tech_kwant_absolute_terms_distractors": [],
    "tech_kwant_negation_detected": False,
    "tech_kwant_negation_emphasized": False,
    "tech_kwant_flags": [],
}


class TestBuildValidationPrompt:
    """T6.2: build_validation_prompt returns correct structure."""

    def test_returns_two_message_dicts(self):
        messages = build_validation_prompt(SAMPLE_QUESTION, SAMPLE_DET_RESULTS)
        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"

    def test_user_content_contains_criteria_tags(self):
        messages = build_validation_prompt(SAMPLE_QUESTION, SAMPLE_DET_RESULTS)
        user_content = messages[1]["content"]
        assert "<criteria_betrouwbaarheid>" in user_content
        assert "</criteria_betrouwbaarheid>" in user_content
        assert "<criteria_technisch>" in user_content
        assert "</criteria_technisch>" in user_content
        assert "<criteria_validiteit>" in user_content
        assert "</criteria_validiteit>" in user_content

    def test_user_content_contains_question_tag(self):
        messages = build_validation_prompt(SAMPLE_QUESTION, SAMPLE_DET_RESULTS)
        user_content = messages[1]["content"]
        assert "<question>" in user_content
        assert "</question>" in user_content
        assert "hoofdstad van Nederland" in user_content

    def test_user_content_contains_deterministic_results_tag(self):
        messages = build_validation_prompt(SAMPLE_QUESTION, SAMPLE_DET_RESULTS)
        user_content = messages[1]["content"]
        assert "<deterministic_results>" in user_content
        assert "</deterministic_results>" in user_content
        assert "tech_kwant_longest_bias" in user_content

    def test_criteria_content_is_loaded(self):
        """Verify that actual criteria markdown content is embedded."""
        messages = build_validation_prompt(SAMPLE_QUESTION, SAMPLE_DET_RESULTS)
        user_content = messages[1]["content"]
        # Check for known content from each criteria file
        assert "Discriminerend Vermogen" in user_content  # betrouwbaarheid
        assert "Plausibiliteit" in user_content  # technisch
        assert "Bloom" in user_content  # validiteit


class TestNoOutputSchema:
    """T6.3: build_validation_prompt does NOT contain output_schema tag."""

    def test_no_output_schema_tag(self):
        messages = build_validation_prompt(SAMPLE_QUESTION, SAMPLE_DET_RESULTS)
        user_content = messages[1]["content"]
        system_content = messages[0]["content"]
        assert "<output_schema>" not in user_content
        assert "<output_schema>" not in system_content
