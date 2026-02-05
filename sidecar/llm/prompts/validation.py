import json
from pathlib import Path

CRITERIA_DIR = Path(__file__).parent.parent.parent / "criteria"

SYSTEM_PROMPT_VALIDATION = (
    "Je bent een expert in toetsdidactiek en MC-vraaganalyse "
    "voor het Nederlandse hoger onderwijs. Je beoordeelt "
    "MC-vragen op drie dimensies: betrouwbaarheid, technische "
    "kwaliteit en validiteit."
)


def _load_criteria(filename: str) -> str:
    """Load a criteria markdown file from the criteria directory."""
    return (CRITERIA_DIR / filename).read_text(encoding="utf-8")


def build_validation_prompt(
    question: dict,
    deterministic_results: dict,
) -> list[dict]:
    """Build the 4-layer validation prompt for the LLM.

    Returns a list of two message dicts: system and user.

    Layer 1: System prompt (role context)
    Layer 2: Criteria (embedded markdown)
    Layer 3: Deterministic pre-analysis results
    Layer 4: The question to evaluate
    """
    criteria_bet = _load_criteria("betrouwbaarheid.md")
    criteria_tech = _load_criteria("technisch.md")
    criteria_val = _load_criteria("validiteit.md")

    user_content = (
        f"<criteria_betrouwbaarheid>\n{criteria_bet}\n</criteria_betrouwbaarheid>\n\n"
        f"<criteria_technisch>\n{criteria_tech}\n</criteria_technisch>\n\n"
        f"<criteria_validiteit>\n{criteria_val}\n</criteria_validiteit>\n\n"
        f"<deterministic_results>\n{json.dumps(deterministic_results, ensure_ascii=False, indent=2)}\n</deterministic_results>\n\n"
        f"<question>\n{json.dumps(question, ensure_ascii=False, indent=2)}\n</question>"
    )

    return [
        {"role": "system", "content": SYSTEM_PROMPT_VALIDATION},
        {"role": "user", "content": user_content},
    ]
