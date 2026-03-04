# Workflow: Toetssamenstelling via AI-gegenereerde MC-vragen

Dit document beschrijft de stapsgewijze workflow om vanuit een beoordeelde vragenbank een complete toets samen te stellen met nieuwe, kwalitatief hoogwaardige MC-vragen.

---

## Overzicht

```
Vragenbank (CSV)
    │
    ▼
Stap 1 – Opschonen bronbestand
    │
    ▼
Stap 2 – Gestratificeerde aselecte steekproef
    │
    ▼
Stap 3 – Genereer nieuwe vraagvarianten (Claude API)
    │
    ▼
Stap 4 – Converteer stellingvragen naar reguliere MC
    │
    ▼
Stap 5 – Genereer afleiders (Claude API)
    │
    ▼
Toets-CSV klaar voor export
```

---

## Vereisten

| Component | Details |
|-----------|---------|
| Bronbestand | CSV met beoordeelde MC-vragen, kolom `oordeel` (GOED/EXCELLENT), kolom `criterium_omschrijving` met wegingspercentage in haakjes |
| Python | 3.10+ |
| Packages | `anthropic` (`pip install anthropic`) |
| API-sleutel | `ANTHROPIC_API_KEY` als omgevingsvariabele (sla op in `.env.local`, staat in `.gitignore`) |

---

## Stap 1 – Opschonen bronbestand

Verwijder lege of incomplete rijen onderaan het bronbestand (spreadsheet-artefacten).

```bash
# Behoud alleen de eerste N regels (1 header + N-1 datarijen)
head -822 bronbestand.csv > bronbestand_clean.csv
```

**Controle:** `wc -l bronbestand_clean.csv` moet het verwachte aantal regels tonen.

---

## Stap 2 – Gestratificeerde aselecte steekproef

Trek een steekproef waarbij de verdeling van leerdoelen de voorgeschreven wegingen volgt.

**Bereken het aantal vragen per leerdoel:**

```
aantal_vragen = totaal_toetsvragen × weging_percentage
```

Voorbeeld voor een toets van 40 vragen:

| Leerdoel | Weging | Vragen |
|----------|--------|--------|
| Strategisch management | 40% | 16 |
| Omgevingsanalyse | 15% | 6 |
| Marketing | 15% | 6 |
| Bedrijfskundige stromingen | 15% | 6 |
| Meervoudige waardecreatie | 15% | 6 |

**Script (Python):**

```python
import csv, random, re
from collections import defaultdict

random.seed(42)  # Reproduceerbaar

QUOTA = {
    'Strategisch management': 16,
    'Omgevingsanalyse': 6,
    'Marketing': 6,
    'Bedrijfskundige stromingen': 6,
    'Meervoudige waardecreatie': 6,
}

groups = defaultdict(list)
with open('bronbestand_clean.csv', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        if row['oordeel'].strip() not in ('GOED', 'EXCELLENT'):
            continue
        short = row['criterium_omschrijving'].strip().strip('"').split(':')[0].strip()
        if short in QUOTA:
            groups[short].append(row)

sample = []
for leerdoel, n in QUOTA.items():
    sample.extend(random.sample(groups[leerdoel], n))
random.shuffle(sample)

# Exporteer naar sample.csv
```

**Controle:**
- Totaal = gewenst aantal vragen
- Verdeling per leerdoel klopt
- Geen dubbele `vraag_id`'s

---

## Stap 3 – Genereer nieuwe vraagvarianten

Herschrijf elke vraag via de Claude API zodat de formulering tekstueel nieuw is, maar het leerdoel, Bloom-niveau en correct-antwoord-concept behouden blijven.

**Model:** `claude-sonnet-4-5-20250929`
**Temperature:** `0.5`
**Structured output:** via `tool_choice`

**Kern van de user-prompt per vraag:**

```
Genereer een NIEUWE MC-vraag over het volgende:

Leerdoel: [criterium_omschrijving]
Cognitief niveau: [validiteit_cognitief_niveau]
Correct antwoord-concept: [correct_antwoord]
Vraagtype: regulier

ORIGINELE VRAAG (gebruik alleen als referentie voor het concept):
Stam: [stam]
Correct antwoord: [correct_antwoord]

Regels:
- Gebruik een ander scenario, andere context en andere bewoordingen
- Maak het realistisch voor eerstejaars bedrijfskundeleerlingen
- 4 homogene antwoordopties, precies 1 correct
- Geen absolute termen, geen lengte-bias
```

**Tool-schema output:**

```json
{
  "stam": "string",
  "stelling_1": "string|null",
  "stelling_2": "string|null",
  "antwoord_a": "string",
  "antwoord_b": "string",
  "antwoord_c": "string",
  "antwoord_d": "string",
  "correct_antwoord": "string",
  "correct_antwoord_choice": "choice1|choice2|choice3|choice4",
  "toelichting": "string"
}
```

**Script:** `temp/generate_new_questions.py`

**Controle:**
- Alle 40 rijen hebben een gevulde `stam`
- Oordeel = `EXCELLENT` voor alle rijen

---

## Stap 4 – Converteer stellingvragen naar reguliere MC

Detecteer stellingvragen (rijen met gevulde `stelling_1`) en genereer voor elk een directe MC-vraag die hetzelfde concept toetst.

**Detectie:**
```python
is_stelling = bool(row.get('stelling_1', '').strip())
```

**Kern van de user-prompt:**

```
Zet de volgende stellingvraag om naar een REGULIERE MC-vraag.

Stelling 1: [stelling_1]
Stelling 2: [stelling_2]
Correct antwoord: [correct_antwoord]
Wat getoetst moet worden: [afleiden uit juiste stelling(en)]

Regels:
- Directe vraag of onvolledige zin (geen stellingsformaat)
- Ander scenario dan de originele stellingen
- 4 homogene opties, cognitief niveau: [validiteit_cognitief_niveau]
```

**Script:** `temp/convert_stelling_to_mc.py`

**Controle:**
- Resterende stellingvragen = 0
- Geen lege stam-velden

---

## Stap 5 – Genereer afleiders

Voeg drie plausibele, kwalitatieve afleiders toe per vraag. Randomiseer de positie van het correcte antwoord.

**Model:** `claude-sonnet-4-5-20250929`
**Temperature:** `0.5`

**Kwaliteitseisen afleiders** (gebaseerd op `docs/criteria-technisch.md`):

| Criterium | Eis |
|-----------|-----|
| Plausibiliteit | Aantrekkelijk voor wie de stof niet beheerst |
| Homogeniteit | Vergelijkbaar in lengte en stijl met correct antwoord (±20% woorden) |
| Logische integriteit | Wederzijds uitsluitend, geen overlap |
| Geen absolute termen | Vermijd "altijd", "nooit", "alle", "geen" |
| Geen flauwekul | Geen absurde of triviale opties |

**Tool-schema output:**

```json
{
  "afleider_1": "string",
  "afleider_2": "string",
  "afleider_3": "string"
}
```

**Positie-randomisatie:** op basis van `hashlib.md5(vraag_id)` → reproduceerbaar, geen aangrenzende bias.

**Script:** `temp/generate_distractors.py`

**Controle:**
```python
# Alle opties gevuld
assert all(row[f'antwoord_{x}'] for x in 'abcd')

# Correct antwoord op juiste positie
keuze_map = {'choice1':'a','choice2':'b','choice3':'c','choice4':'d'}
assert row[f'antwoord_{keuze_map[row["correct_antwoord_choice"]]}'] == row['correct_antwoord']

# Geen duplicaten binnen een vraag
assert len({row[f'antwoord_{x}'] for x in 'abcd'}) == 4
```

---

## Eindresultaat

Een CSV met de volgende gevulde kolommen per vraag:

| Kolom | Inhoud |
|-------|--------|
| `criterium_omschrijving` | Leerdoel met weging |
| `vraag_id` | `GEN_[origineel_id]` |
| `stam` | Nieuwe vraagstam |
| `correct_antwoord` | Tekst correct antwoord |
| `correct_antwoord_choice` | `choice1`–`choice4` |
| `antwoord_a` t/m `antwoord_d` | Alle vier opties |
| `validiteit_cognitief_niveau` | Bloom-niveau |
| `oordeel` | `EXCELLENT` |

---

## Scripts overzicht

| Script | Doel |
|--------|------|
| `temp/generate_new_questions.py` | Stap 3: genereer nieuwe vraagvarianten |
| `temp/convert_stelling_to_mc.py` | Stap 4: stellingvragen → reguliere MC |
| `temp/generate_distractors.py` | Stap 5: afleiders genereren |

Voer elk script uit vanuit de `temp/` map:

```bash
cd temp/
export $(cat ../.env.local | xargs)
python3 generate_new_questions.py
python3 convert_stelling_to_mc.py
python3 generate_distractors.py
```
