import asyncio
import logging
from datetime import datetime, timezone
from typing import Any

from supabase import Client

from analyzers.deterministic import analyze as deterministic_analyze
from analyzers.schemas import QuestionInput
from llm.client import LLMClient, LLMValidationError

logger = logging.getLogger(__name__)

MAX_CONCURRENCY = 5


async def _validate_single_question(
    question_row: dict[str, Any],
    llm_client: LLMClient,
    supabase: Client,
    semaphore: asyncio.Semaphore,
    *,
    update_progress: bool = True,
) -> None:
    """Validate a single question: deterministic + LLM analysis, then write assessment."""
    async with semaphore:
        question_id = question_row["id"]
        question_version = question_row["version"]

        options = question_row["options"]
        correct_index = next(
            (i for i, opt in enumerate(options) if opt.get("is_correct")),
            0,
        )

        question_input = QuestionInput(
            stem=question_row["stem"],
            options=[opt["text"] for opt in options],
            correct_index=correct_index,
        )

        # Layer 1: Deterministic analysis
        det_result = deterministic_analyze(question_input)

        # Layer 2: LLM analysis
        question_dict = {
            "stam": question_row["stem"],
            "opties": [
                {
                    "positie": opt["position"],
                    "tekst": opt["text"],
                    "is_correct": opt["is_correct"],
                }
                for opt in options
            ],
            "leerdoel": question_row.get("learning_objective", ""),
        }

        llm_result = await asyncio.to_thread(
            llm_client.validate_question,
            question_dict,
            det_result.model_dump(),
        )

        # Combine and write assessment
        assessment = {
            "question_id": question_id,
            "question_version": question_version,
            "assessed_at": datetime.now(timezone.utc).isoformat(),
            **det_result.model_dump(),
            "bet_discriminatie": llm_result.bet_discriminatie.value,
            "bet_ambiguiteit": llm_result.bet_ambiguiteit.value,
            "bet_score": llm_result.bet_score,
            "bet_toelichting": llm_result.bet_toelichting,
            "tech_kwal_stam_score": llm_result.tech_kwal_stam_score,
            "tech_kwal_afleiders_score": llm_result.tech_kwal_afleiders_score,
            "tech_kwal_score": llm_result.tech_kwal_score,
            "tech_problemen": llm_result.tech_problemen,
            "tech_toelichting": llm_result.tech_toelichting,
            "val_cognitief_niveau": llm_result.val_cognitief_niveau.value,
            "val_score": llm_result.val_score,
            "val_toelichting": llm_result.val_toelichting,
            "improvement_suggestions": [
                s.model_dump() for s in llm_result.improvement_suggestions
            ],
        }

        supabase.table("assessments").upsert(
            assessment,
            on_conflict="question_id,question_version",
        ).execute()

        # Update progress counter (atomic increment via SQL function)
        if update_progress:
            supabase.rpc(
                "increment_questions_analyzed",
                {"p_exam_id": question_row["exam_id"]},
            ).execute()


async def run_single_validation(
    exam_id: str,
    question_id: str,
    supabase: Client,
    llm_client: LLMClient,
) -> None:
    """Re-validate a single question without changing exam-level status."""
    try:
        response = (
            supabase.table("questions")
            .select("*")
            .eq("id", question_id)
            .single()
            .execute()
        )
        question_row = response.data

        if not question_row:
            logger.warning(f"Question {question_id} not found")
            return

        semaphore = asyncio.Semaphore(1)
        await _validate_single_question(
            question_row, llm_client, supabase, semaphore, update_progress=False
        )

    except Exception as e:
        logger.error(
            f"Single validation failed for question {question_id}: {e}"
        )
        raise


async def run_validation(
    exam_id: str,
    supabase: Client,
    llm_client: LLMClient,
) -> None:
    """Run the full validation pipeline for all questions in an exam.

    1. Fetch questions from Supabase
    2. For each question: deterministic analysis + LLM validation
    3. Write combined assessments
    4. Update exam status
    """
    try:
        # Update exam status to processing
        supabase.table("exams").update(
            {"analysis_status": "processing"}
        ).eq("id", exam_id).execute()

        # Fetch questions
        response = (
            supabase.table("questions")
            .select("*")
            .eq("exam_id", exam_id)
            .execute()
        )
        questions = response.data

        if not questions:
            logger.warning(f"No questions found for exam {exam_id}")
            supabase.table("exams").update(
                {"analysis_status": "completed"}
            ).eq("id", exam_id).execute()
            return

        # Set question_count and reset progress
        supabase.table("exams").update(
            {"question_count": len(questions), "questions_analyzed": 0}
        ).eq("id", exam_id).execute()

        semaphore = asyncio.Semaphore(MAX_CONCURRENCY)

        tasks = [
            _validate_single_question(q, llm_client, supabase, semaphore)
            for q in questions
        ]
        await asyncio.gather(*tasks)

        # Mark exam as completed with final progress count
        supabase.table("exams").update(
            {"analysis_status": "completed", "questions_analyzed": len(questions)}
        ).eq("id", exam_id).execute()

    except Exception as e:
        logger.error(f"Validation pipeline failed for exam {exam_id}: {e}")
        supabase.table("exams").update(
            {"analysis_status": "failed"}
        ).eq("id", exam_id).execute()
        raise
