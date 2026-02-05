import math
import re

from .schemas import DeterministicResult, QuestionInput

ABSOLUTE_TERMS = [
    "altijd",
    "nooit",
    "alle",
    "geen",
    "elke",
    "iedere",
    "uitsluitend",
    "alleen",
    "volledig",
    "absoluut",
    "zonder uitzondering",
]

NEGATION_TERMS = ["niet", "geen", "behalve", "uitgezonderd"]


def _check_longest_bias(question: QuestionInput) -> bool:
    """Check if the correct answer is >50% longer than the average distractor length."""
    correct_text = question.options[question.correct_index]
    distractors = [
        opt for i, opt in enumerate(question.options) if i != question.correct_index
    ]
    if not distractors:
        return False
    avg_distractor_len = sum(len(d) for d in distractors) / len(distractors)
    if avg_distractor_len == 0:
        return len(correct_text) > 0
    return len(correct_text) > avg_distractor_len * 1.5


def _check_homogeneity(question: QuestionInput) -> float:
    """Calculate option length homogeneity score (0.0-1.0, 1.0 = perfectly homogeneous)."""
    lengths = [len(opt) for opt in question.options]
    if len(lengths) < 2:
        return 1.0
    mean = sum(lengths) / len(lengths)
    if mean == 0:
        return 1.0
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    std_dev = math.sqrt(variance)
    # Normalize: coefficient of variation (std/mean), invert so 1.0 = homogeneous
    cv = std_dev / mean
    score = max(0.0, 1.0 - cv)
    return round(score, 2)


def _find_absolute_terms(text: str) -> list[str]:
    """Find absolute terms in a text string."""
    text_lower = text.lower()
    found = []
    for term in ABSOLUTE_TERMS:
        # Use word boundary matching for multi-word and single-word terms
        pattern = r"\b" + re.escape(term) + r"\b"
        if re.search(pattern, text_lower):
            found.append(term)
    return found


def _check_absolute_terms_correct(question: QuestionInput) -> list[str]:
    """Find absolute terms in the correct answer."""
    correct_text = question.options[question.correct_index]
    return _find_absolute_terms(correct_text)


def _check_absolute_terms_distractors(question: QuestionInput) -> list[str]:
    """Find absolute terms across all distractors."""
    found = []
    for i, opt in enumerate(question.options):
        if i != question.correct_index:
            for term in _find_absolute_terms(opt):
                if term not in found:
                    found.append(term)
    return found


def _check_negation_detected(stem: str) -> bool:
    """Detect negation words in the question stem."""
    stem_lower = stem.lower()
    for term in NEGATION_TERMS:
        pattern = r"\b" + re.escape(term) + r"\b"
        if re.search(pattern, stem_lower):
            return True
    return False


def _check_negation_emphasized(stem: str) -> bool:
    """Check if detected negation is emphasized (UPPERCASE or **bold**)."""
    for term in NEGATION_TERMS:
        # Check uppercase
        upper_pattern = r"\b" + re.escape(term.upper()) + r"\b"
        if re.search(upper_pattern, stem):
            return True
        # Check markdown bold
        bold_pattern = r"\*\*" + re.escape(term) + r"\*\*"
        if re.search(bold_pattern, stem, re.IGNORECASE):
            return True
    return False


def _generate_flags(result: DeterministicResult) -> list[str]:
    """Generate descriptive flag strings for each detected problem."""
    flags = []
    if result.tech_kwant_longest_bias:
        flags.append("langste-antwoord-bias")
    if result.tech_kwant_homogeneity_score < 0.5:
        flags.append("lage-homogeniteit-opties")
    if result.tech_kwant_absolute_terms_correct:
        flags.append("absolute-termen-in-correct-antwoord")
    if result.tech_kwant_absolute_terms_distractors:
        flags.append("absolute-termen-in-afleiders")
    if result.tech_kwant_negation_detected and not result.tech_kwant_negation_emphasized:
        flags.append("ontkenning-zonder-nadruk")
    return flags


def analyze(question: QuestionInput) -> DeterministicResult:
    """Run all deterministic checks on a question and return the result."""
    longest_bias = _check_longest_bias(question)
    homogeneity = _check_homogeneity(question)
    abs_correct = _check_absolute_terms_correct(question)
    abs_distractors = _check_absolute_terms_distractors(question)
    negation_detected = _check_negation_detected(question.stem)
    negation_emphasized = _check_negation_emphasized(question.stem) if negation_detected else False

    # Build partial result to generate flags
    partial = DeterministicResult(
        tech_kwant_longest_bias=longest_bias,
        tech_kwant_homogeneity_score=homogeneity,
        tech_kwant_absolute_terms_correct=abs_correct,
        tech_kwant_absolute_terms_distractors=abs_distractors,
        tech_kwant_negation_detected=negation_detected,
        tech_kwant_negation_emphasized=negation_emphasized,
        tech_kwant_flags=[],
    )
    flags = _generate_flags(partial)

    return DeterministicResult(
        tech_kwant_longest_bias=longest_bias,
        tech_kwant_homogeneity_score=homogeneity,
        tech_kwant_absolute_terms_correct=abs_correct,
        tech_kwant_absolute_terms_distractors=abs_distractors,
        tech_kwant_negation_detected=negation_detected,
        tech_kwant_negation_emphasized=negation_emphasized,
        tech_kwant_flags=flags,
    )
