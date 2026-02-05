import io

from openpyxl import load_workbook

from .schemas import ParsedOption, ParsedQuestion

OPTION_COLUMNS = ["optie_a", "optie_b", "optie_c", "optie_d"]
OPTION_LABELS = ["A", "B", "C", "D"]
REQUIRED_COLUMNS = {"stam", "optie_a", "optie_b", "optie_c", "optie_d", "correct"}


def parse_xlsx(content: bytes) -> list[ParsedQuestion]:
    """Parse an Excel file with columns: stam, optie_a, optie_b, optie_c, optie_d, correct."""
    wb = load_workbook(filename=io.BytesIO(content), read_only=True)
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        raise ValueError("Excel bestand is leeg")

    # Normalize headers
    headers = [str(cell).strip().lower() if cell else "" for cell in rows[0]]
    missing = REQUIRED_COLUMNS - set(headers)
    if missing:
        raise ValueError(
            f"Ontbrekende kolommen in Excel: {', '.join(sorted(missing))}. "
            f"Verwacht: {', '.join(sorted(REQUIRED_COLUMNS))}"
        )

    col_idx = {name: i for i, name in enumerate(headers)}

    questions: list[ParsedQuestion] = []
    for row_num, row in enumerate(rows[1:], start=2):
        stem = str(row[col_idx["stam"]] or "").strip()
        if not stem:
            continue

        correct_label = str(row[col_idx["correct"]] or "").strip().upper()
        if correct_label not in OPTION_LABELS:
            raise ValueError(
                f"Rij {row_num}: ongeldige waarde voor 'correct': '{correct_label}'. "
                f"Verwacht: A, B, C of D"
            )

        options: list[ParsedOption] = []
        for i, col_name in enumerate(OPTION_COLUMNS):
            text = str(row[col_idx[col_name]] or "").strip()
            options.append(
                ParsedOption(
                    text=text,
                    position=i,
                    is_correct=(OPTION_LABELS[i] == correct_label),
                )
            )

        questions.append(ParsedQuestion(stem=stem, options=options))

    wb.close()
    return questions
