# Workflow: Toetssamenstelling — Strategisch Management Periode 1

Dit document beschrijft de stapsgewijze workflow om vanuit de beoordeelde vragenbank
Strategisch Management Periode 1 een complete toets van 40 nieuwe MC-vragen samen te stellen.

---

## Overzicht

```
Database_Periode1_SM_AI_CHECK_geclassificeerd.csv
    │
    ▼
Stap 1 – Opschonen bronbestand (head)
    │
    ▼
Stap 2 – Gestratificeerde aselecte steekproef
          Filter: oordeel ∈ {GOED, EXCELLENT}
          QUOTA: 5 leerdoelen o.b.v. SM-toetsmatrijs
    │
    ▼
Stap 3 – Genereer nieuwe vraagvarianten (Claude API)
    │
    ▼
Stap 4 – Converteer stellingvragen naar reguliere MC (Claude API)
    │
    ▼
Stap 5 – Genereer afleiders (Claude API)
    │
    ▼
sample_40_vragen_nieuw.csv (toets klaar voor export)
```

---

## Vereisten

| Component | Details |
|-----------|---------|
| Bronbestand | `temp/Database_Periode1_SM_AI_CHECK_geclassificeerd.csv` — CSV met beoordeelde MC-vragen, kolom `oordeel` (GOED/EXCELLENT), kolom `criterium_omschrijving` met wegingspercentage |
| Python | 3.10+ |
| Packages | `anthropic` (`pip install anthropic`) |
| API-sleutel | `ANTHROPIC_API_KEY` als omgevingsvariabele (sla op in `.env.local`, staat in `.gitignore`) |
| Model | `claude-sonnet-4-5-20250929` |

---

## Stap 1 – Opschonen bronbestand

Verwijder lege of incomplete rijen onderaan het bronbestand (spreadsheet-artefacten).

```bash
# Behoud alleen de eerste 822 regels (1 header + 821 datarijen)
head -822 Database_Periode1_SM_AI_CHECK_geclassificeerd.csv > bronbestand_clean.csv
```

**Controle:** `wc -l bronbestand_clean.csv` moet 822 tonen.

---

## Stap 2 – Gestratificeerde aselecte steekproef

Trek een steekproef waarbij de verdeling van leerdoelen de toetsmatrijs-wegingen volgt.
Filter: alleen vragen met `oordeel` = GOED of EXCELLENT.

**QUOTA (40 vragen totaal):**

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

# Exporteer naar sample_40_vragen.csv
```

**Output:** `temp/sample_40_vragen.csv`

**Controle:**
- Totaal = 40 vragen
- Verdeling per leerdoel klopt
- Geen dubbele `vraag_id`'s

---

## Stap 3 – Genereer nieuwe vraagvarianten

Herschrijf elke vraag via de Claude API zodat de formulering tekstueel nieuw is,
maar het leerdoel, Bloom-niveau en correct-antwoord-concept behouden blijven.

**Constanten in het script:**

```python
INPUT_FILE  = "sample_40_vragen.csv"
OUTPUT_FILE = "sample_40_vragen_nieuw.csv"
MODEL       = "claude-sonnet-4-5-20250929"
TEMPERATURE = 0.5
```

**Script:** `temp/generate_new_questions.py`

```bash
python3 generate_new_questions.py
```

**Controle:**
- Alle 40 rijen hebben een gevulde `stam`
- `oordeel` = EXCELLENT voor alle rijen

---

## Stap 4 – Converteer stellingvragen naar reguliere MC

Detecteer stellingvragen (rijen met gevulde `stelling_1`) en genereer voor elk een
directe MC-vraag die hetzelfde concept toetst.

> **Let op:** De SM Periode 1 dataset bevat stellingvragen. Stap 4 is hier verplicht.

**Constanten in het script:**

```python
FILE  = "sample_40_vragen_nieuw.csv"
MODEL = "claude-sonnet-4-5-20250929"
```

**Script:** `temp/convert_stelling_to_mc.py`

```bash
python3 convert_stelling_to_mc.py
```

**Controle:**
- Resterende stellingvragen (`stelling_1` gevuld) = 0
- Geen lege stam-velden

---

## Stap 5 – Genereer afleiders

Voeg drie plausibele, kwalitatieve afleiders toe per vraag. Randomiseer de positie
van het correcte antwoord op basis van `hashlib.md5(vraag_id)` (reproduceerbaar).

**Constanten in het script:**

```python
FILE  = "sample_40_vragen_nieuw.csv"
MODEL = "claude-sonnet-4-5-20250929"
```

**Script:** `temp/generate_distractors.py`

```bash
python3 generate_distractors.py
```

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

**Bestand:** `temp/sample_40_vragen_nieuw.csv`

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

---

## Uitvoervolgorde

```bash
cd temp/
export $(grep -v '^#' ../.env.local | xargs)

# Stap 1 (eenmalig, indien nog niet gedaan)
head -822 Database_Periode1_SM_AI_CHECK_geclassificeerd.csv > bronbestand_clean.csv

# Stap 2 – steekproef (inline Python, zie boven)
# → output: sample_40_vragen.csv

# Stap 3
python3 generate_new_questions.py        # → sample_40_vragen_nieuw.csv

# Stap 4
python3 convert_stelling_to_mc.py        # in-place

# Stap 5
python3 generate_distractors.py          # in-place
```

> **Let op:** `generate_new_questions.py` stopt als `sample_40_vragen_nieuw.csv` al bestaat.
> Gebruik `--force` om te overschrijven.
