import csv
import io

from .schemas import ParsedOption, ParsedQuestion

REQUIRED_COLUMNS = {"stam", "optie_a", "optie_b", "optie_c", "optie_d", "correct"}
OPTION_COLUMNS = ["optie_a", "optie_b", "optie_c", "optie_d"]
OPTION_LABELS = ["A", "B", "C", "D"]
OPTIONAL_COLUMNS = {
    "categorie": "category",
    "bloom_niveau": "bloom_level",
    "leerdoel": "learning_goal",
    "vraag_id": "question_id",
    "id": "question_id",
}


def _detect_delimiter(content: str) -> str:
    """Detect whether the CSV uses comma or semicolon as delimiter."""
    first_line = content.split("\n")[0]
    if first_line.count(";") > first_line.count(","):
        return ";"
    return ","


def parse_csv(content: str | bytes) -> list[ParsedQuestion]:
    """Parse a CSV file with columns: stam, optie_a, optie_b, optie_c, optie_d, correct.

    Supports both comma and semicolon delimiters.
    The 'correct' column should contain A, B, C, or D.
    """
    if isinstance(content, bytes):
        content = content.decode("utf-8-sig")

    delimiter = _detect_delimiter(content)
    reader = csv.DictReader(io.StringIO(content), delimiter=delimiter)

    # Normalize field names
    if reader.fieldnames is None:
        raise ValueError("CSV bestand is leeg of heeft geen headers")

    fieldnames = [f.strip().lower() for f in reader.fieldnames]
    missing = REQUIRED_COLUMNS - set(fieldnames)
    if missing:
        raise ValueError(
            f"Ontbrekende kolommen in CSV: {', '.join(sorted(missing))}. "
            f"Verwacht: {', '.join(sorted(REQUIRED_COLUMNS))}"
        )

    # Re-read with normalized fieldnames
    reader = csv.DictReader(
        io.StringIO(content), fieldnames=fieldnames, delimiter=delimiter
    )
    next(reader)  # Skip the header row

    questions: list[ParsedQuestion] = []
    for row_num, row in enumerate(reader, start=2):
        stem = row["stam"].strip()

        # Skip completely empty rows (all fields blank)
        all_values = [row.get(col, "").strip() for col in fieldnames]
        if not any(all_values):
            continue

        correct_label = row["correct"].strip().upper()
        if correct_label not in OPTION_LABELS:
            correct_label = ""  # Let validation catch invalid/missing correct

        options: list[ParsedOption] = []
        for i, col in enumerate(OPTION_COLUMNS):
            text = row[col].strip()
            options.append(
                ParsedOption(
                    text=text,
                    position=i,
                    is_correct=(OPTION_LABELS[i] == correct_label) if correct_label else False,
                )
            )

        # Read optional columns
        extra: dict[str, str | None] = {}
        for csv_col, field_name in OPTIONAL_COLUMNS.items():
            if csv_col in fieldnames and field_name not in extra:
                val = row.get(csv_col, "")
                if val and val.strip():
                    extra[field_name] = val.strip()

        # Auto-assign question_id from row number if not in file
        if "question_id" not in extra:
            extra["question_id"] = str(row_num - 1)

        questions.append(ParsedQuestion(stem=stem, options=options, **extra))

    return questions
