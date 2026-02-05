import pytest

from analyzers.deterministic import analyze
from analyzers.schemas import QuestionInput


class TestLongestAnswerBias:
    """T5.3: Longest answer bias detection."""

    def test_detects_longest_bias(self):
        q = QuestionInput(
            stem="Wat is X?",
            options=[
                "Kort",
                "Kort",
                "Dit is een heel lang antwoord dat duidelijk langer is",
                "Kort",
            ],
            correct_index=2,
        )
        result = analyze(q)
        assert result.tech_kwant_longest_bias is True

    def test_no_bias_when_options_similar_length(self):
        q = QuestionInput(
            stem="Wat is X?",
            options=["Optie A hier", "Optie B hier", "Optie C hier", "Optie D hier"],
            correct_index=0,
        )
        result = analyze(q)
        assert result.tech_kwant_longest_bias is False


class TestHomogeneityScore:
    """T5.4: Homogeneity score calculation."""

    def test_identical_length_options(self):
        q = QuestionInput(
            stem="Wat is X?",
            options=["AAAA", "BBBB", "CCCC", "DDDD"],
            correct_index=0,
        )
        result = analyze(q)
        assert result.tech_kwant_homogeneity_score >= 0.95

    def test_highly_variable_lengths(self):
        q = QuestionInput(
            stem="Wat is X?",
            options=[
                "A",
                "Dit is een veel langer antwoord met extra woorden erbij",
                "B",
                "C",
            ],
            correct_index=0,
        )
        result = analyze(q)
        assert result.tech_kwant_homogeneity_score < 0.5


class TestAbsoluteTerms:
    """T5.5: Absolute terms detection."""

    def test_absolute_term_in_correct_answer(self):
        q = QuestionInput(
            stem="Wat is X?",
            options=[
                "Dit is altijd het geval",
                "Optie B",
                "Optie C",
                "Optie D",
            ],
            correct_index=0,
        )
        result = analyze(q)
        assert "altijd" in result.tech_kwant_absolute_terms_correct

    def test_absolute_terms_in_distractors(self):
        q = QuestionInput(
            stem="Wat is X?",
            options=[
                "Correct antwoord",
                "Dit geldt nooit",
                "Alle gevallen",
                "Optie D",
            ],
            correct_index=0,
        )
        result = analyze(q)
        assert "nooit" in result.tech_kwant_absolute_terms_distractors
        assert "alle" in result.tech_kwant_absolute_terms_distractors

    def test_no_absolute_terms(self):
        q = QuestionInput(
            stem="Wat is X?",
            options=[
                "Optie A",
                "Optie B",
                "Optie C",
                "Optie D",
            ],
            correct_index=0,
        )
        result = analyze(q)
        assert result.tech_kwant_absolute_terms_correct == []
        assert result.tech_kwant_absolute_terms_distractors == []


class TestNegationDetection:
    """T5.6: Negation detection and emphasis."""

    def test_emphasized_negation_uppercase(self):
        q = QuestionInput(
            stem="Welke stelling is NIET correct?",
            options=["A", "B", "C", "D"],
            correct_index=0,
        )
        result = analyze(q)
        assert result.tech_kwant_negation_detected is True
        assert result.tech_kwant_negation_emphasized is True

    def test_unemphasized_negation(self):
        q = QuestionInput(
            stem="Welke stelling is niet correct?",
            options=["A", "B", "C", "D"],
            correct_index=0,
        )
        result = analyze(q)
        assert result.tech_kwant_negation_detected is True
        assert result.tech_kwant_negation_emphasized is False

    def test_no_negation(self):
        q = QuestionInput(
            stem="Welke stelling is correct?",
            options=["A", "B", "C", "D"],
            correct_index=0,
        )
        result = analyze(q)
        assert result.tech_kwant_negation_detected is False

    def test_bold_negation(self):
        q = QuestionInput(
            stem="Welke stelling is **niet** correct?",
            options=["A", "B", "C", "D"],
            correct_index=0,
        )
        result = analyze(q)
        assert result.tech_kwant_negation_detected is True
        assert result.tech_kwant_negation_emphasized is True


class TestFlagsGeneration:
    """T5.7: Flags generation with multiple problems."""

    def test_multiple_flags(self):
        q = QuestionInput(
            stem="Welke stelling is niet correct?",
            options=[
                "Kort",
                "Kort",
                "Dit is een heel lang antwoord dat duidelijk veel langer is dan de rest",
                "Kort",
            ],
            correct_index=2,
        )
        result = analyze(q)
        assert len(result.tech_kwant_flags) >= 2
        assert "langste-antwoord-bias" in result.tech_kwant_flags
        assert "ontkenning-zonder-nadruk" in result.tech_kwant_flags

    def test_no_flags_for_clean_question(self):
        q = QuestionInput(
            stem="Wat is de hoofdstad van Nederland?",
            options=["Amsterdam", "Rotterdam", "Den Haag.", "Utrecht.."],
            correct_index=0,
        )
        result = analyze(q)
        assert result.tech_kwant_flags == []
