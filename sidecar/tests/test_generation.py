"""Tests for RAG retrieval and question generation (Task 13)."""

import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from rag.chunker import Chunk


# ── T13.1: retrieve_chunks ───────────────────────────────────────────────────

class TestRetrieveChunks:
    @pytest.mark.asyncio
    async def test_retrieves_and_converts_chunks(self):
        """T13.1: Verify query leads to embedding call + match_chunks RPC."""
        from rag.retriever import retrieve_chunks

        mock_supabase = MagicMock()

        # Mock RPC result
        mock_supabase.rpc.return_value.execute.return_value = MagicMock(
            data=[
                {
                    "content": "Eerste chunk over toetsing.",
                    "position": 0,
                    "page": 1,
                    "metadata": {"material_id": "mat-1"},
                },
                {
                    "content": "Tweede chunk over Bloom.",
                    "position": 1,
                    "page": 2,
                    "metadata": {"material_id": "mat-1"},
                },
            ]
        )

        with patch(
            "rag.retriever.embed_query",
            new_callable=AsyncMock,
        ) as mock_embed:
            mock_embed.return_value = [0.1] * 768

            chunks = await retrieve_chunks(
                query="Leerdoel over toetsing",
                material_id="mat-1",
                supabase=mock_supabase,
                top_k=5,
            )

        # Embedding was called with the query
        mock_embed.assert_called_once_with("Leerdoel over toetsing")

        # RPC was called with correct parameters
        mock_supabase.rpc.assert_called_once_with(
            "match_chunks",
            {
                "query_embedding": [0.1] * 768,
                "match_count": 5,
                "filter_material_id": "mat-1",
            },
        )

        # Chunks are properly converted
        assert len(chunks) == 2
        assert isinstance(chunks[0], Chunk)
        assert chunks[0].text == "Eerste chunk over toetsing."
        assert chunks[0].page == 1
        assert chunks[1].text == "Tweede chunk over Bloom."
        assert chunks[1].position == 1

    @pytest.mark.asyncio
    async def test_empty_results(self):
        """Verify empty RPC result returns empty list."""
        from rag.retriever import retrieve_chunks

        mock_supabase = MagicMock()
        mock_supabase.rpc.return_value.execute.return_value = MagicMock(data=[])

        with patch(
            "rag.retriever.embed_query",
            new_callable=AsyncMock,
        ) as mock_embed:
            mock_embed.return_value = [0.1] * 768

            chunks = await retrieve_chunks(
                query="Onbekend onderwerp",
                material_id="mat-1",
                supabase=mock_supabase,
            )

        assert len(chunks) == 0


# ── T13.2: build_generation_prompt ───────────────────────────────────────────

class TestBuildGenerationPrompt:
    def test_prompt_structure(self):
        """T13.2: Verify prompt contains specification, source_material, and quality_rules."""
        from llm.prompts.generation import build_generation_prompt

        specification = {
            "count": 3,
            "bloom_level": "toepassen",
            "learning_goal": "De student kan Bloom-niveaus toepassen.",
            "num_options": 4,
        }

        chunks = [
            Chunk(text="Bloom's taxonomie beschrijft zes niveaus.", position=0, page=1),
            Chunk(text="Toepassen is het derde niveau.", position=1, page=2),
        ]

        messages = build_generation_prompt(specification, chunks)

        assert len(messages) == 2
        assert messages[0]["role"] == "system"
        assert messages[1]["role"] == "user"

        user_content = messages[1]["content"]

        # Contains specification XML
        assert "<specification>" in user_content
        assert "<count>3</count>" in user_content
        assert "<bloom_level>toepassen</bloom_level>" in user_content
        assert "De student kan Bloom-niveaus toepassen." in user_content
        assert "<num_options>4</num_options>" in user_content

        # Contains source material with chunk tags
        assert "<source_material>" in user_content
        assert '<chunk id="0" page="1">' in user_content
        assert "Bloom's taxonomie beschrijft zes niveaus." in user_content
        assert '<chunk id="1" page="2">' in user_content
        assert "Toepassen is het derde niveau." in user_content

        # Contains quality rules
        assert "<quality_rules>" in user_content

    def test_prompt_instruction(self):
        """Verify final instruction mentions count and bloom level."""
        from llm.prompts.generation import build_generation_prompt

        spec = {
            "count": 5,
            "bloom_level": "begrijpen",
            "learning_goal": "Test",
            "num_options": 3,
        }
        chunks = [Chunk(text="Test inhoud.", position=0)]

        messages = build_generation_prompt(spec, chunks)
        user_content = messages[1]["content"]

        assert "5 MC-vragen" in user_content
        assert '"begrijpen"' in user_content
        assert "3 antwoordopties" in user_content

    def test_system_prompt_is_dutch(self):
        """System prompt should be in Dutch."""
        from llm.prompts.generation import SYSTEM_PROMPT_GENERATION

        assert "multiple-choice" in SYSTEM_PROMPT_GENERATION.lower()
        assert "Nederlands" in SYSTEM_PROMPT_GENERATION


# ── T13.4: generation_pipeline ───────────────────────────────────────────────

class TestGenerationPipeline:
    @pytest.mark.asyncio
    async def test_full_pipeline(self):
        """T13.4: Verify full flow: read job → retrieve → generate → insert → validate → update."""
        from llm.schemas import (
            BloomLevel,
            GeneratedQuestion,
            GenerationResult,
            QuestionOption,
        )
        from services.generation_pipeline import run_generation

        mock_supabase = MagicMock()

        # Mock job query
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={
                "id": "job-1",
                "material_id": "mat-1",
                "exam_id": "exam-1",
                "specification": {
                    "count": 2,
                    "bloom_level": "begrijpen",
                    "learning_goal": "Studenten begrijpen toetstheorie.",
                    "num_options": 4,
                },
            }
        )

        # Mock update (for status changes)
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

        # Mock insert (for questions) — return inserted data with id
        insert_data = [{"id": "q-gen-1"}]
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=insert_data
        )

        # Mock chunks from retriever
        mock_chunks = [
            Chunk(text="Toetstheorie betreft het meten van kennis.", position=0, page=1),
            Chunk(text="Betrouwbaarheid is een kernbegrip.", position=1, page=2),
        ]

        # Mock LLM generation result
        mock_generation_result = GenerationResult(
            questions=[
                GeneratedQuestion(
                    stem="Wat is het doel van toetstheorie?",
                    options=[
                        QuestionOption(text="Kennis meten", position=0, is_correct=True),
                        QuestionOption(text="Motivatie verhogen", position=1, is_correct=False),
                        QuestionOption(text="Kosten verlagen", position=2, is_correct=False),
                        QuestionOption(text="Tijd besparen", position=3, is_correct=False),
                    ],
                    bloom_level=BloomLevel.begrijpen,
                    chunk_ids=["0", "1"],
                ),
                GeneratedQuestion(
                    stem="Wat is betrouwbaarheid?",
                    options=[
                        QuestionOption(text="Consistentie van meting", position=0, is_correct=True),
                        QuestionOption(text="Snelheid van afname", position=1, is_correct=False),
                        QuestionOption(text="Moeilijkheidsgraad", position=2, is_correct=False),
                        QuestionOption(text="Lengte van toets", position=3, is_correct=False),
                    ],
                    bloom_level=BloomLevel.begrijpen,
                    chunk_ids=["1"],
                ),
            ]
        )

        with patch(
            "services.generation_pipeline.get_supabase_client",
            return_value=mock_supabase,
        ), patch(
            "services.generation_pipeline.retrieve_chunks",
            new_callable=AsyncMock,
            return_value=mock_chunks,
        ) as mock_retrieve, patch(
            "services.generation_pipeline.LLMClient",
        ) as MockLLMClient, patch(
            "services.generation_pipeline.run_validation",
            new_callable=AsyncMock,
        ) as mock_validate:
            mock_llm = MockLLMClient.return_value
            mock_llm.generate_questions.return_value = mock_generation_result

            await run_generation("job-1")

        # 1. Job was read
        mock_supabase.table.assert_any_call("generation_jobs")

        # 2. Chunks were retrieved with the learning goal
        mock_retrieve.assert_called_once()
        call_kwargs = mock_retrieve.call_args
        assert call_kwargs.kwargs["query"] == "Studenten begrijpen toetstheorie."
        assert call_kwargs.kwargs["material_id"] == "mat-1"

        # 3. LLM generation was called
        mock_llm.generate_questions.assert_called_once()

        # 4. Questions were inserted
        insert_calls = mock_supabase.table.return_value.insert.call_args_list
        assert len(insert_calls) > 0

        # 5. Validation was run
        mock_validate.assert_called_once()

        # 6. Job was updated with completed status
        update_calls = mock_supabase.table.return_value.update.call_args_list
        assert len(update_calls) >= 2  # At least: processing + completed

    @pytest.mark.asyncio
    async def test_pipeline_handles_failure(self):
        """Verify pipeline sets job status to failed on error."""
        from services.generation_pipeline import run_generation

        mock_supabase = MagicMock()

        # Mock job query
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={
                "id": "job-1",
                "material_id": "mat-1",
                "exam_id": "exam-1",
                "specification": {
                    "count": 2,
                    "bloom_level": "begrijpen",
                    "learning_goal": "Test",
                    "num_options": 4,
                },
            }
        )

        # Mock update
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

        with patch(
            "services.generation_pipeline.get_supabase_client",
            return_value=mock_supabase,
        ), patch(
            "services.generation_pipeline.retrieve_chunks",
            new_callable=AsyncMock,
            side_effect=ValueError("No relevant chunks found"),
        ), patch(
            "services.generation_pipeline.LLMClient",
        ):
            with pytest.raises(ValueError, match="No relevant chunks"):
                await run_generation("job-1")

        # Verify job was set to failed
        update_calls = mock_supabase.table.return_value.update.call_args_list
        # Check that "failed" status was set
        failed_updates = [
            c for c in update_calls
            if c.args and isinstance(c.args[0], dict) and c.args[0].get("status") == "failed"
        ]
        assert len(failed_updates) >= 1
