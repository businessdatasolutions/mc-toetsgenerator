import os

SYSTEM_PROMPT_GENERATION = """Je bent een expert in het maken van multiple-choice toetsvragen voor het Nederlands hoger onderwijs.

Je taak is om hoogwaardige MC-vragen te genereren op basis van het aangeleverde bronmateriaal. Elke vraag moet:
- Direct gebaseerd zijn op de aangeleverde bronchunks
- Het gevraagde Bloom-niveau hebben
- Technisch correct zijn (duidelijke stam, plausibele afleiders)
- In het Nederlands geschreven zijn

Gebruik de kwaliteitsregels als leidraad voor het maken van goede vragen."""


def build_generation_prompt(
    specification: dict,
    chunks: list,
    criteria_dir: str | None = None,
) -> list[dict]:
    """Build the 4-layer generation prompt.

    Returns a list of 2 dicts: [system_message, user_message].
    """
    if criteria_dir is None:
        criteria_dir = os.path.join(
            os.path.dirname(__file__), "..", "..", "criteria"
        )

    # Load criteria files for quality rules
    quality_rules = []
    for filename in ["technisch.md", "betrouwbaarheid.md", "validiteit.md"]:
        filepath = os.path.join(criteria_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                quality_rules.append(f.read())

    # Build specification XML
    spec_xml = f"""<specification>
<count>{specification.get('count', 5)}</count>
<bloom_level>{specification.get('bloom_level', 'begrijpen')}</bloom_level>
<learning_goal>{specification.get('learning_goal', '')}</learning_goal>
<num_options>{specification.get('num_options', 4)}</num_options>
</specification>"""

    # Build source material XML with chunk references
    source_parts = ["<source_material>"]
    for i, chunk in enumerate(chunks):
        page_attr = f' page="{chunk.page}"' if hasattr(chunk, "page") and chunk.page else ""
        source_parts.append(
            f'<chunk id="{i}"{page_attr}>\n{chunk.text}\n</chunk>'
        )
    source_parts.append("</source_material>")
    source_xml = "\n".join(source_parts)

    # Build quality rules XML
    rules_xml = "<quality_rules>\n"
    for rule in quality_rules:
        rules_xml += rule + "\n\n"
    rules_xml += "</quality_rules>"

    user_content = f"""{spec_xml}

{source_xml}

{rules_xml}

Genereer exact {specification.get('count', 5)} MC-vragen op Bloom-niveau "{specification.get('bloom_level', 'begrijpen')}" over het leerdoel: "{specification.get('learning_goal', '')}".

Elke vraag moet {specification.get('num_options', 4)} antwoordopties hebben, waarvan precies 1 correct is.
Verwijs in chunk_ids naar de chunk id's waarop de vraag is gebaseerd."""

    return [
        {"role": "system", "content": SYSTEM_PROMPT_GENERATION},
        {"role": "user", "content": user_content},
    ]
