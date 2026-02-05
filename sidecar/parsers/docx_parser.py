import re

from docx import Document
from docx.text.paragraph import Paragraph

from .schemas import ParsedOption, ParsedQuestion

# Pattern to match question numbers like "1." or "1)" or "Vraag 1:"
QUESTION_PATTERN = re.compile(r"^(?:Vraag\s+)?\d+[.):\s]")

# Pattern to match option labels like "A." "A)" "a."
OPTION_PATTERN = re.compile(r"^([A-Da-d])[.)]\s*(.*)")


def _is_bold(paragraph: Paragraph) -> bool:
    """Check if the entire paragraph is bold."""
    if not paragraph.runs:
        return False
    return all(run.bold for run in paragraph.runs if run.text.strip())


def _has_bold_runs(paragraph: Paragraph) -> bool:
    """Check if the paragraph contains any bold runs."""
    return any(run.bold and run.text.strip() for run in paragraph.runs)


def _text_has_asterisk(text: str) -> bool:
    """Check if text starts or ends with an asterisk marker."""
    stripped = text.strip()
    return stripped.startswith("*") or stripped.endswith("*")


def _clean_text(text: str) -> str:
    """Remove asterisk markers from text."""
    return text.strip().strip("*").strip()


def parse_docx(content: bytes) -> list[ParsedQuestion]:
    """Parse a DOCX file with numbered questions and lettered options.

    Recognizes patterns like:
        1. What is X?
        A. Option one
        B. Option two *
        C. Option three
        D. Option four

    Correct answer can be marked with:
    - Asterisk (*) at end of option text
    - Bold formatting on the option
    """
    import io

    doc = Document(io.BytesIO(content))

    questions: list[ParsedQuestion] = []
    current_stem: str | None = None
    current_options: list[tuple[str, str, bool]] = []  # (label, text, is_correct)

    def _flush_question():
        nonlocal current_stem, current_options
        if current_stem and current_options:
            # If no correct answer was marked, default to first option
            has_correct = any(c for _, _, c in current_options)
            options = [
                ParsedOption(
                    text=text,
                    position=i,
                    is_correct=is_correct if has_correct else (i == 0),
                )
                for i, (_, text, is_correct) in enumerate(current_options)
            ]
            questions.append(ParsedQuestion(stem=current_stem, options=options))
        current_stem = None
        current_options = []

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue

        # Check if this is a new question
        if QUESTION_PATTERN.match(text):
            _flush_question()
            # Remove the number prefix
            current_stem = QUESTION_PATTERN.sub("", text).strip()
            current_options = []
            continue

        # Check if this is an option
        option_match = OPTION_PATTERN.match(text)
        if option_match and current_stem is not None:
            label = option_match.group(1).upper()
            option_text = option_match.group(2).strip()

            is_correct = (
                _text_has_asterisk(option_text)
                or _is_bold(para)
                or _has_bold_runs(para)
            )
            option_text = _clean_text(option_text)
            current_options.append((label, option_text, is_correct))
            continue

        # If we have a current stem and no option match, this might be
        # a continuation of the stem
        if current_stem is not None and not current_options:
            current_stem += " " + text

    # Don't forget the last question
    _flush_question()

    return questions
