from pydantic import BaseModel

from .schemas import ParsedQuestion


class FieldError(BaseModel):
    """A single validation error for a specific field."""

    field: str
    code: str
    message: str


class QuestionValidationResult(BaseModel):
    """Validation result for a single question."""

    question_index: int
    question_id: str
    is_valid: bool
    errors: list[FieldError]
    warnings: list[FieldError]


class ValidationResponse(BaseModel):
    """Complete validation response for all parsed questions."""

    is_valid: bool
    total_questions: int
    valid_count: int
    invalid_count: int
    results: list[QuestionValidationResult]


def validate_questions(questions: list[ParsedQuestion]) -> ValidationResponse:
    """Validate a list of parsed questions against completeness rules.

    Rules per question:
    - Stem must not be empty
    - At least 2 options
    - Exactly 1 correct answer
    - No empty option texts
    - Category must be present

    Rules across questions:
    - Question IDs must be unique

    Warnings:
    - Only 2 options (prefer 3-4)
    """
    results: list[QuestionValidationResult] = []

    # Collect all question IDs to check for duplicates
    id_counts: dict[str, list[int]] = {}
    for i, q in enumerate(questions):
        qid = q.question_id or str(i + 1)
        id_counts.setdefault(qid, []).append(i)

    duplicate_ids = {qid for qid, indices in id_counts.items() if len(indices) > 1}

    for i, q in enumerate(questions):
        errors: list[FieldError] = []
        warnings: list[FieldError] = []
        qid = q.question_id or str(i + 1)

        # Stem not empty
        if not q.stem or not q.stem.strip():
            errors.append(
                FieldError(
                    field="stem",
                    code="empty_stem",
                    message="Vraagstam is leeg",
                )
            )

        # Minimum 2 options
        if len(q.options) < 2:
            errors.append(
                FieldError(
                    field="options",
                    code="too_few_options",
                    message=f"Minimaal 2 antwoordopties vereist, maar {len(q.options)} gevonden",
                )
            )

        # Exactly 1 correct answer
        correct_count = sum(1 for o in q.options if o.is_correct)
        if correct_count == 0:
            errors.append(
                FieldError(
                    field="correct_option",
                    code="no_correct",
                    message="Geen correct antwoord aangeduid",
                )
            )
        elif correct_count > 1:
            errors.append(
                FieldError(
                    field="correct_option",
                    code="multiple_correct",
                    message=f"{correct_count} correcte antwoorden aangeduid, maar precies 1 verwacht",
                )
            )

        # No empty option texts
        for j, opt in enumerate(q.options):
            if not opt.text or not opt.text.strip():
                label = chr(65 + j)
                errors.append(
                    FieldError(
                        field="options",
                        code="empty_option",
                        message=f"Optie {label} heeft een lege tekst",
                    )
                )

        # Category present
        if not q.category or not q.category.strip():
            errors.append(
                FieldError(
                    field="category",
                    code="empty_category",
                    message="Onderwerpcategorie ontbreekt",
                )
            )

        # Duplicate question ID
        if qid in duplicate_ids:
            errors.append(
                FieldError(
                    field="question_id",
                    code="duplicate_id",
                    message=f"Vraag-ID '{qid}' komt meerdere keren voor",
                )
            )

        # Warning: only 2 options
        if len(q.options) == 2:
            warnings.append(
                FieldError(
                    field="options",
                    code="few_options",
                    message="Slechts 2 antwoordopties; 3 of 4 opties zijn aanbevolen",
                )
            )

        results.append(
            QuestionValidationResult(
                question_index=i,
                question_id=qid,
                is_valid=len(errors) == 0,
                errors=errors,
                warnings=warnings,
            )
        )

    valid_count = sum(1 for r in results if r.is_valid)
    return ValidationResponse(
        is_valid=valid_count == len(results),
        total_questions=len(results),
        valid_count=valid_count,
        invalid_count=len(results) - valid_count,
        results=results,
    )
