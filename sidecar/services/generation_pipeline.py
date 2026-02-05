import asyncio
import logging

from supabase import Client

from llm.client import LLMClient, LLMValidationError
from rag.retriever import retrieve_chunks
from services.supabase_client import get_supabase_client
from services.validation_pipeline import run_validation

logger = logging.getLogger(__name__)


async def run_generation(job_id: str) -> None:
    """Full generation pipeline: retrieve chunks → generate questions → validate.

    Args:
        job_id: The generation_jobs record ID.
    """
    supabase = get_supabase_client()
    llm_client = LLMClient()

    try:
        # 13.4a: Read generation_jobs record
        job = (
            supabase.table("generation_jobs")
            .select("*")
            .eq("id", job_id)
            .single()
            .execute()
        )
        if not job.data:
            raise ValueError(f"Generation job {job_id} not found")

        job_data = job.data
        specification = job_data["specification"]
        material_id = job_data["material_id"]
        exam_id = job_data["exam_id"]

        # Update status to processing
        supabase.table("generation_jobs").update(
            {"status": "processing"}
        ).eq("id", job_id).execute()

        # 13.4b: Retrieve relevant chunks using the learning goal as query
        learning_goal = specification.get("learning_goal", "")
        top_k = specification.get("top_k", 10)
        chunks = await retrieve_chunks(
            query=learning_goal,
            material_id=material_id,
            supabase=supabase,
            top_k=top_k,
        )

        if not chunks:
            raise ValueError(
                f"No relevant chunks found for material {material_id}"
            )

        # 13.4c: Generate questions via LLM
        result = await asyncio.to_thread(
            llm_client.generate_questions,
            specification,
            chunks,
        )

        # 13.4d: Write generated questions to questions table
        question_ids = []
        for i, gen_q in enumerate(result.questions):
            options = [
                {
                    "text": opt.text,
                    "position": opt.position,
                    "is_correct": opt.is_correct,
                }
                for opt in gen_q.options
            ]
            correct_index = next(
                (j for j, opt in enumerate(gen_q.options) if opt.is_correct),
                0,
            )

            question_row = {
                "exam_id": exam_id,
                "position": i + 1,
                "stem": gen_q.stem,
                "options": options,
                "correct_option": correct_index,
                "bloom_level": gen_q.bloom_level.value,
                "learning_goal": specification.get("learning_goal", ""),
                "source": "generated",
            }

            inserted = (
                supabase.table("questions")
                .insert(question_row)
                .execute()
            )
            question_ids.append(inserted.data[0]["id"])

        # 13.4e: Run validation pipeline on the generated questions
        await run_validation(exam_id, supabase, llm_client)

        # 13.4f: Update generation job status
        supabase.table("generation_jobs").update(
            {
                "status": "completed",
                "result_question_ids": question_ids,
                "completed_at": "now()",
            }
        ).eq("id", job_id).execute()

        logger.info(
            f"Generation pipeline complete for job {job_id}: "
            f"{len(question_ids)} questions generated"
        )

    except Exception as e:
        logger.error(f"Generation pipeline failed for job {job_id}: {e}")
        supabase.table("generation_jobs").update(
            {
                "status": "failed",
                "error_message": str(e),
            }
        ).eq("id", job_id).execute()
        raise
