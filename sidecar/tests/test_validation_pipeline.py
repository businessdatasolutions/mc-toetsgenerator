"""T6.5: Validation pipeline test with mocked Supabase and LLM clients."""

import asyncio
from unittest.mock import MagicMock, patch, call

import pytest

from llm.schemas import (
    AmbiguiteitLevel,
    BloomLevel,
    DiscriminatieLevel,
    ImprovementSuggestion,
    ValidationResult,
)
from services.validation_pipeline import run_validation


def _make_question_row(index: int) -> dict:
    return {
        "id": f"q-{index}",
        "exam_id": "exam-1",
        "version": 1,
        "stem": f"Vraag {index}?",
        "options": [
            {"text": "Optie A", "position": 0, "is_correct": True},
            {"text": "Optie B", "position": 1, "is_correct": False},
            {"text": "Optie C", "position": 2, "is_correct": False},
            {"text": "Optie D", "position": 3, "is_correct": False},
        ],
        "learning_objective": "Student kan X.",
    }


def _make_validation_result() -> ValidationResult:
    return ValidationResult(
        bet_discriminatie=DiscriminatieLevel.hoog,
        bet_ambiguiteit=AmbiguiteitLevel.geen,
        bet_score=4,
        bet_toelichting="Goed.",
        tech_kwal_stam_score=4,
        tech_kwal_afleiders_score=4,
        tech_kwal_score=4,
        tech_problemen=[],
        tech_toelichting="Goed.",
        val_cognitief_niveau=BloomLevel.toepassen,
        val_score=4,
        val_toelichting="Goed.",
        improvement_suggestions=[],
    )


class TestValidationPipeline:
    """T6.5: Mocked validation pipeline test."""

    def test_pipeline_processes_all_questions(self):
        questions = [_make_question_row(i) for i in range(3)]

        # Mock Supabase client
        mock_supabase = MagicMock()

        # Mock questions select
        mock_select = MagicMock()
        mock_select.execute.return_value = MagicMock(data=questions)
        mock_eq = MagicMock(return_value=mock_select)
        mock_supabase.table.return_value.select.return_value.eq = mock_eq

        # Mock update (for exam status)
        mock_update_exec = MagicMock()
        mock_update_exec.execute.return_value = MagicMock()
        mock_supabase.table.return_value.update.return_value.eq.return_value = (
            mock_update_exec
        )

        # Mock upsert (for assessments)
        mock_upsert_exec = MagicMock()
        mock_upsert_exec.execute.return_value = MagicMock()
        mock_supabase.table.return_value.upsert.return_value = mock_upsert_exec

        # Mock LLM client
        mock_llm = MagicMock()
        mock_llm.validate_question.return_value = _make_validation_result()

        # Run the pipeline
        asyncio.run(run_validation("exam-1", mock_supabase, mock_llm))

        # Verify: 3 LLM calls
        assert mock_llm.validate_question.call_count == 3

        # Verify: assessments were written (upsert called)
        upsert_calls = mock_supabase.table.return_value.upsert.call_count
        assert upsert_calls == 3

        # Verify: exam status was updated (at least processing + completed)
        update_calls = mock_supabase.table.return_value.update.call_args_list
        statuses = [c[0][0] for c in update_calls]
        assert {"analysis_status": "processing"} in statuses
        assert {"analysis_status": "completed"} in statuses

    def test_pipeline_sets_failed_on_error(self):
        """When LLM fails, exam status should be set to 'failed'."""
        questions = [_make_question_row(0)]

        mock_supabase = MagicMock()

        mock_select = MagicMock()
        mock_select.execute.return_value = MagicMock(data=questions)
        mock_eq = MagicMock(return_value=mock_select)
        mock_supabase.table.return_value.select.return_value.eq = mock_eq

        mock_update_exec = MagicMock()
        mock_update_exec.execute.return_value = MagicMock()
        mock_supabase.table.return_value.update.return_value.eq.return_value = (
            mock_update_exec
        )

        # Mock LLM to raise an error
        mock_llm = MagicMock()
        mock_llm.validate_question.side_effect = Exception("LLM error")

        with pytest.raises(Exception, match="LLM error"):
            asyncio.run(run_validation("exam-1", mock_supabase, mock_llm))

        # Verify: exam status was set to failed
        update_calls = mock_supabase.table.return_value.update.call_args_list
        statuses = [c[0][0] for c in update_calls]
        assert {"analysis_status": "failed"} in statuses
