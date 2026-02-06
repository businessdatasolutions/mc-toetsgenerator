"""Integration tests for LLM client with real API calls.

These tests require ANTHROPIC_API_KEY to be set.
Run with: pytest tests/test_llm_integration.py -v
"""

import os

import pytest

from llm.client import LLMClient
from llm.schemas import BloomLevel, GenerationResult, ValidationResult
from rag.chunker import Chunk


# Skip all tests if API key is not set
pytestmark = pytest.mark.skipif(
    not os.environ.get("ANTHROPIC_API_KEY"),
    reason="ANTHROPIC_API_KEY not set",
)


class TestValidateQuestionIntegration:
    """T6.4: Integration test for validate_question with real API."""

    def test_validates_mc_question(self):
        """Call validate_question with a sample MC question and verify response."""
        client = LLMClient()

        question = {
            "stem": "Wat is de hoofdstad van Nederland?",
            "options": [
                {"text": "Amsterdam", "position": 0, "is_correct": True},
                {"text": "Rotterdam", "position": 1, "is_correct": False},
                {"text": "Den Haag", "position": 2, "is_correct": False},
                {"text": "Utrecht", "position": 3, "is_correct": False},
            ],
            "learning_objective": "De student kan de hoofdstad van Nederland identificeren.",
        }

        deterministic_results = {
            "tech_kwant_longest_bias": False,
            "tech_kwant_homogeneity_score": 0.85,
            "tech_kwant_absolute_terms_correct": [],
            "tech_kwant_absolute_terms_distractors": [],
            "tech_kwant_negation_detected": False,
            "tech_kwant_negation_emphasized": False,
            "tech_kwant_flags": [],
        }

        result = client.validate_question(question, deterministic_results)

        # Verify result is a ValidationResult instance
        assert isinstance(result, ValidationResult)

        # Verify all scores are between 1-5
        assert 1 <= result.bet_score <= 5
        assert 1 <= result.tech_kwal_score <= 5
        assert 1 <= result.val_score <= 5

        # Verify discriminatie is valid
        assert result.bet_discriminatie in ["hoog", "gemiddeld", "laag", "geen"]

        # Verify explanations are present
        assert result.bet_toelichting is not None
        assert len(result.bet_toelichting) > 0
        assert result.tech_toelichting is not None
        assert result.val_toelichting is not None

        # Verify bloom level
        assert result.val_cognitief_niveau in [
            BloomLevel.onthouden,
            BloomLevel.begrijpen,
            BloomLevel.toepassen,
            BloomLevel.analyseren,
        ]

        print(f"\n=== Validation Result ===")
        print(f"Betrouwbaarheid: {result.bet_score}/5 ({result.bet_discriminatie})")
        print(f"  Toelichting: {result.bet_toelichting[:100]}...")
        print(f"Technisch: {result.tech_kwal_score}/5")
        print(f"  Stam: {result.tech_kwal_stam_score}/5")
        print(f"  Afleiders: {result.tech_kwal_afleiders_score}/5")
        print(f"Validiteit: {result.val_score}/5")
        print(f"  Bloom: {result.val_cognitief_niveau}")
        print(f"Verbetervoorstellen: {len(result.improvement_suggestions)}")
        for s in result.improvement_suggestions[:2]:
            print(f"  - [{s.dimensie}] {s.suggestie[:60]}...")


class TestGenerateQuestionsIntegration:
    """T13.3: Integration test for generate_questions with real API."""

    def test_generates_mc_questions(self):
        """Call generate_questions with dummy chunks and verify response."""
        client = LLMClient()

        specification = {
            "count": 2,
            "bloom_level": "toepassen",
            "learning_goal": "De student kan Bloom's taxonomie toepassen bij het classificeren van leerdoelen.",
            "num_options": 4,
        }

        chunks = [
            Chunk(
                text="""Bloom's taxonomie is een hiërarchisch classificatiesysteem voor
                leerdoelen, ontwikkeld door Benjamin Bloom in 1956. De taxonomie bevat
                zes niveaus: onthouden, begrijpen, toepassen, analyseren, evalueren en
                creëren. Het 'toepassen'-niveau houdt in dat studenten geleerde concepten
                kunnen gebruiken in nieuwe situaties.""",
                position=0,
                page=1,
            ),
            Chunk(
                text="""Bij het 'toepassen'-niveau gaat het om het uitvoeren of gebruiken
                van een procedure in een bepaalde situatie. Voorbeelden zijn: een
                wiskundige formule gebruiken om een probleem op te lossen, een theorie
                toepassen op een casus, of een procedure volgen om een taak uit te voeren.
                Dit niveau vereist dat de student de stof niet alleen kent, maar ook
                daadwerkelijk kan gebruiken.""",
                position=1,
                page=2,
            ),
        ]

        result = client.generate_questions(specification, chunks)

        # Verify result is a GenerationResult instance
        assert isinstance(result, GenerationResult)

        # Verify we got the requested number of questions
        assert len(result.questions) == 2

        for i, q in enumerate(result.questions):
            # Verify question structure
            assert q.stem is not None
            assert len(q.stem) > 10

            # Verify options
            assert len(q.options) == 4
            correct_count = sum(1 for o in q.options if o.is_correct)
            assert correct_count == 1, f"Question {i} should have exactly 1 correct answer"

            # Verify bloom level
            assert q.bloom_level in [
                BloomLevel.onthouden,
                BloomLevel.begrijpen,
                BloomLevel.toepassen,
                BloomLevel.analyseren,
            ]

            # Verify chunk references
            assert q.chunk_ids is not None
            assert len(q.chunk_ids) > 0

            print(f"\n=== Generated Question {i+1} ===")
            print(f"Bloom: {q.bloom_level}")
            print(f"Stam: {q.stem}")
            for o in q.options:
                marker = "✓" if o.is_correct else " "
                print(f"  [{marker}] {o.text}")
            print(f"Chunks: {q.chunk_ids}")
