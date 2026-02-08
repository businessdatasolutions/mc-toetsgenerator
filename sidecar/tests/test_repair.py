"""Tests for AI repair prompt and schemas (Issue #3)."""

import pytest

from llm.prompts.repair import build_repair_prompt
from llm.schemas import RepairPlan, RepairProposal


class TestBuildRepairPrompt:
    """Tests for the repair prompt builder."""

    def _make_questions_and_validation(self):
        """Helper: questions with missing categories + validation result."""
        questions = [
            {
                "stem": "Wat is de hoofdstad van Nederland?",
                "options": [
                    {"text": "Amsterdam", "position": 0, "is_correct": True},
                    {"text": "Rotterdam", "position": 1, "is_correct": False},
                    {"text": "Den Haag", "position": 2, "is_correct": False},
                ],
                "category": None,
                "bloom_level": None,
            },
            {
                "stem": "Wat is 2 + 2?",
                "options": [
                    {"text": "3", "position": 0, "is_correct": False},
                    {"text": "4", "position": 1, "is_correct": True},
                    {"text": "5", "position": 2, "is_correct": False},
                ],
                "category": "Wiskunde",
                "bloom_level": None,
            },
        ]
        validation = {
            "is_valid": False,
            "total_questions": 2,
            "valid_count": 1,
            "invalid_count": 1,
            "results": [
                {
                    "question_index": 0,
                    "question_id": "1",
                    "is_valid": False,
                    "errors": [
                        {
                            "field": "category",
                            "code": "empty_category",
                            "message": "Onderwerpcategorie ontbreekt",
                        }
                    ],
                    "warnings": [],
                },
                {
                    "question_index": 1,
                    "question_id": "2",
                    "is_valid": True,
                    "errors": [],
                    "warnings": [],
                },
            ],
        }
        return questions, validation

    def test_returns_two_messages(self):
        """Prompt should return system + user messages."""
        questions, validation = self._make_questions_and_validation()
        messages = build_repair_prompt(questions, validation)
        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"

    def test_system_prompt_contains_expert_context(self):
        """System prompt should mention toetsdidactiek expertise."""
        questions, validation = self._make_questions_and_validation()
        messages = build_repair_prompt(questions, validation)
        assert "toetsdidactiek" in messages[0]["content"]

    def test_user_prompt_contains_only_invalid_questions(self):
        """User prompt should only include questions with errors."""
        questions, validation = self._make_questions_and_validation()
        messages = build_repair_prompt(questions, validation)
        user_content = messages[1]["content"]
        # Question 0 (invalid) should be present
        assert "Wat is de hoofdstad van Nederland?" in user_content
        # Question 1 (valid) should NOT be included in repair items
        assert "question_index\": 0" in user_content

    def test_user_prompt_contains_missing_fields(self):
        """User prompt should list which fields are missing."""
        questions, validation = self._make_questions_and_validation()
        messages = build_repair_prompt(questions, validation)
        user_content = messages[1]["content"]
        assert "category" in user_content
        assert "missing_fields" in user_content

    def test_user_prompt_contains_bloom_levels(self):
        """User prompt should mention valid Bloom levels."""
        questions, validation = self._make_questions_and_validation()
        messages = build_repair_prompt(questions, validation)
        user_content = messages[1]["content"]
        assert "onthouden" in user_content
        assert "analyseren" in user_content


class TestRepairSchemas:
    """Tests for RepairPlan and RepairProposal Pydantic models."""

    def test_valid_repair_proposal(self):
        """Valid RepairProposal should be accepted."""
        proposal = RepairProposal(
            question_index=0,
            field="category",
            current_value=None,
            proposed_value="Aardrijkskunde",
            explanation="De vraag gaat over de hoofdstad van Nederland.",
        )
        assert proposal.field == "category"
        assert proposal.proposed_value == "Aardrijkskunde"

    def test_valid_repair_plan(self):
        """Valid RepairPlan with proposals should be accepted."""
        plan = RepairPlan(
            proposals=[
                RepairProposal(
                    question_index=0,
                    field="category",
                    current_value=None,
                    proposed_value="Aardrijkskunde",
                    explanation="De vraag gaat over de hoofdstad.",
                ),
                RepairProposal(
                    question_index=0,
                    field="bloom_level",
                    current_value=None,
                    proposed_value="onthouden",
                    explanation="Feitelijke kennis ophalen.",
                ),
            ],
            summary="2 velden aangevuld voor 1 vraag.",
        )
        assert len(plan.proposals) == 2
        assert plan.summary == "2 velden aangevuld voor 1 vraag."

    def test_empty_repair_plan(self):
        """Empty RepairPlan (no proposals) should be accepted."""
        plan = RepairPlan(proposals=[], summary="Geen reparaties nodig.")
        assert len(plan.proposals) == 0

    def test_repair_plan_serialization(self):
        """RepairPlan should serialize to dict correctly."""
        plan = RepairPlan(
            proposals=[
                RepairProposal(
                    question_index=0,
                    field="category",
                    current_value=None,
                    proposed_value="Biologie",
                    explanation="Biologische vraag.",
                )
            ],
            summary="1 voorstel.",
        )
        data = plan.model_dump()
        assert data["proposals"][0]["proposed_value"] == "Biologie"
        assert data["summary"] == "1 voorstel."
