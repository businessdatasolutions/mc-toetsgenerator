import csv
import io

from .schemas import ParsedOption, ParsedQuestion

REQUIRED_COLUMNS = {"stam", "optie_a", "optie_b", "optie_c", "optie_d", "correct"}
OPTION_COLUMNS = ["optie_a", "optie_b", "optie_c", "optie_d"]
OPTION_LABELS = ["A", "B", "C", "D"]


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
        if not stem:
            continue

        correct_label = row["correct"].strip().upper()
        if correct_label not in OPTION_LABELS:
            raise ValueError(
                f"Rij {row_num}: ongeldige waarde voor 'correct': '{row['correct']}'. "
                f"Verwacht: A, B, C of D"
            )

        options: list[ParsedOption] = []
        for i, col in enumerate(OPTION_COLUMNS):
            text = row[col].strip()
            options.append(
                ParsedOption(
                    text=text,
                    position=i,
                    is_correct=(OPTION_LABELS[i] == correct_label),
                )
            )

        questions.append(ParsedQuestion(stem=stem, options=options))

    return questions
