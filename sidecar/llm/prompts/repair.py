import json

SYSTEM_PROMPT_REPAIR = (
    "Je bent een expert in toetsdidactiek voor het Nederlands hoger onderwijs. "
    "Je helpt docenten bij het aanvullen van ontbrekende metadata bij MC-vragen. "
    "Je analyseert de vraagstam en antwoordopties om te bepalen welk onderwerp "
    "of categorie de vraag behandelt, welk Bloom-niveau de vraag meet, en welk "
    "leerdoel erbij past. Geef altijd een korte toelichting in het Nederlands "
    "bij je voorstel."
)


def build_repair_prompt(
    questions: list[dict],
    validation: dict,
) -> list[dict]:
    """Build the repair prompt for the LLM.

    Returns a list of two message dicts: system and user.
    The user message contains the questions with their validation errors,
    so the LLM knows exactly which fields need to be filled.
    """
    # Filter to only include questions that have errors
    invalid_indices = {
        r["question_index"]
        for r in validation.get("results", [])
        if not r.get("is_valid", True)
    }

    # Build a compact representation of questions needing repair
    repair_items = []
    for r in validation.get("results", []):
        if not r.get("is_valid", True):
            idx = r["question_index"]
            q = questions[idx] if idx < len(questions) else None
            if q is None:
                continue
            missing_fields = [e["field"] for e in r.get("errors", [])]
            repair_items.append(
                {
                    "question_index": idx,
                    "question_id": r.get("question_id", str(idx + 1)),
                    "stem": q.get("stem", ""),
                    "options": q.get("options", []),
                    "current_category": q.get("category"),
                    "current_bloom_level": q.get("bloom_level"),
                    "current_learning_goal": q.get("learning_goal"),
                    "missing_fields": missing_fields,
                    "error_messages": [
                        e["message"] for e in r.get("errors", [])
                    ],
                }
            )

    user_content = (
        "<instructie>\n"
        "Analyseer de onderstaande MC-vragen en genereer voorstellen om de "
        "ontbrekende velden aan te vullen. Focus op de velden die als 'missing' "
        "zijn gemarkeerd. Gebruik de vraagstam en antwoordopties om het onderwerp, "
        "Bloom-niveau en leerdoel af te leiden.\n\n"
        "Bloom-niveaus: onthouden, begrijpen, toepassen, analyseren\n"
        "</instructie>\n\n"
        f"<questions_needing_repair>\n"
        f"{json.dumps(repair_items, ensure_ascii=False, indent=2)}\n"
        f"</questions_needing_repair>"
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT_REPAIR},
        {"role": "user", "content": user_content},
    ]
