# Workflow: Toetssamenstelling — HAN P2 THEOOM

Dit document beschrijft de stapsgewijze workflow om vanuit de vragenbank HAN Periode 2
Theoretisch Ondernemerschapskunde & Organisatiemanagement (THEOOM) een complete toets
van 40 nieuwe MC-vragen samen te stellen.

---

## Overzicht

```
vragen_HAN_P2_THEO_compleet_gekleurd_v2.xlsx
    │
    ▼
Stap 2 – Gestratificeerde aselecte steekproef
          Filter: kwaliteitsscores ≥ 3 (max. 1 score = 3), geen stellingvragen
          QUOTA: 6 leerdoelen o.b.v. Toetsmatrijs THEOOM P2
    │
    ▼
Stap 3 – Genereer nieuwe vraagvarianten (Claude API)
    │
    ▼
Stap 5 – Genereer afleiders (Claude API)
    │
    ▼
sample_40_han_nieuw.csv (toets klaar voor export)
```

> **Stap 1 (opschonen) en Stap 4 (stellingvragen converteren) worden overgeslagen.**
> Het Excel-bronbestand is al schoon en bevat geen stellingvragen na het kwaliteitsfilter.

---

## Vereisten

| Component | Details |
|-----------|---------|
| Bronbestand | `temp/vragen_HAN_P2_THEO_compleet_gekleurd_v2.xlsx` — Excel-werkboek met beoordeelde MC-vragen; kolomnamen `val_score`, `bet_score`, `tech_kwal_score` (schaal 1–5); correct antwoord als letter (A/B/C/D) in kolom `Correct Answer` |
| Toetsmatrijs | `temp/Toetsmatrijs THEOOM P2.pdf` |
| Python | 3.10+ |
| Packages | `anthropic`, `openpyxl` (`pip install anthropic openpyxl`) |
| API-sleutel | `ANTHROPIC_API_KEY` als omgevingsvariabele (sla op in `.env.local`, staat in `.gitignore`) |
| Model | `claude-sonnet-4-6` |

---

## Stap 2 – Gestratificeerde aselecte steekproef

Gebruik het script `temp/step2_sample_han.py`. Het script leest het Excel-bestand,
past het kwaliteitsfilter en de stelling-filter toe, en trekt een reproduceerbare
gestratificeerde steekproef.

### Kwaliteitsfilter

Een vraag is acceptabel als:
- Alle drie de dimensies scoren ≥ 3
- **Maximaal 1 dimensie** scoort exact 3 (de andere twee moeten ≥ 4 zijn)
- De vraag is **geen stellingvraag** (detectie via tekstpatronen in de vraagstam)

```python
scores = [val_score, bet_score, tech_kwal_score]
scores_ok = all(s >= 3 for s in scores) and sum(s == 3 for s in scores) <= 1
```

### Toetsmatrijs QUOTA (40 vragen totaal)

Gebaseerd op `Toetsmatrijs THEOOM P2.pdf` (Niveau 1, cesuur 60%):

| Criterium | Leerdoel (kort) | Weging | Vragen |
|-----------|----------------|--------|--------|
| 1 | De student begrijpt de relevante begrippen, theorieën en modellen om de interne organisatie te analyseren | 15% | 6 |
| 2 | De student begrijpt de voor- en nadelen van de diverse organisatiestructuren (inrichting) | 15% | 6 |
| 3 | De student begrijpt de relevante begrippen vanuit Operations Management en Procesmanagement om organisaties te verbeteren | 30% | 12 |
| 4 | De student begrijpt de relevante begrippen uit de planning & controlcyclus (begrip) | 10% | 4 |
| 5 | De student past de planning & controlcyclus toe op een bedrijfskundige casus (toepassen) | 10% | 4 |
| 6 | De student herkent de relevante juridische begrippen uit het ondernemingsrecht en contractrecht | 20% | 8 |

### Beschikbaarheid na filter (run van 2026-03-03, seed=42)

| Criterium | Beschikbaar | Benodigd |
|-----------|------------|---------|
| 1 – Interne organisatie | 11 | 6 |
| 2 – Organisatiestructuren | 20 | 6 |
| 3 – Operations & Procesmanagement | 75 | 12 |
| 4 – Planning & control (begrip) | 19 | 4 |
| 5 – Planning & control (toepassen) | 26 | 4 |
| 6 – Juridische begrippen | 40 | 8 |

### Uitvoering

```bash
# Inspecteer kolomnamen (eerste keer of na Excel-update)
python3 step2_sample_han.py --inspect

# Maak de steekproef
python3 step2_sample_han.py
```

**Output:** `temp/sample_40_han.csv`

> Gebruik `--force` als `sample_40_han.csv` al bestaat en je het wilt overschrijven.

**Controle:**
- Totaal = 40 vragen
- Verdeling per criterium klopt (script rapporteert dit automatisch)
- Geen dubbele `vraag_id`'s
- Stellingvragen = 0

---

## Stap 3 – Genereer nieuwe vraagvarianten

Herschrijf elke vraag via de Claude API zodat de formulering tekstueel nieuw is,
maar het leerdoel, Bloom-niveau en correct-antwoord-concept behouden blijven.

**Constanten in het script (voor deze workflow):**

```python
INPUT_FILE  = "sample_40_han.csv"
OUTPUT_FILE = "sample_40_han_nieuw.csv"
MODEL       = "claude-sonnet-4-6"
TEMPERATURE = 0.5
```

**Script:** `temp/generate_new_questions.py`

```bash
python3 generate_new_questions.py
```

> Het script stopt als `sample_40_han_nieuw.csv` al bestaat. Gebruik `--force` om te overschrijven.

**Controle:**
- Alle 40 rijen hebben een gevulde `stam`
- `oordeel` = EXCELLENT voor alle rijen

---

## Stap 4 – Stellingvragen converteren

**Niet van toepassing.** Het kwaliteitsfilter in stap 2 sluit alle stellingvragen
expliciet uit. De steekproef bevat gegarandeerd 0 stellingvragen.

---

## Stap 5 – Genereer afleiders

Voeg drie plausibele, kwalitatieve afleiders toe per vraag. Randomiseer de positie
van het correcte antwoord op basis van `hashlib.md5(vraag_id)` (reproduceerbaar).

**Constanten in het script (voor deze workflow):**

```python
FILE  = "sample_40_han_nieuw.csv"
MODEL = "claude-sonnet-4-6"
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

**Bestand:** `temp/sample_40_han_nieuw.csv`

| Kolom | Inhoud |
|-------|--------|
| `criterium_nr` | Criterium 1–6 |
| `criterium_omschrijving` | Leerdoel (kort) |
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
| `temp/step2_sample_han.py` | Stap 2: steekproef uit Excel (met kwaliteits- en stellingsfilter) |
| `temp/generate_new_questions.py` | Stap 3: genereer nieuwe vraagvarianten |
| `temp/generate_distractors.py` | Stap 5: afleiders genereren |

---

## Uitvoervolgorde

```bash
cd temp/
export $(grep -v '^#' ../.env.local | xargs)

# Stap 2 – steekproef
python3 step2_sample_han.py              # → sample_40_han.csv

# Stap 3
python3 generate_new_questions.py        # → sample_40_han_nieuw.csv

# Stap 4 – overgeslagen (geen stellingvragen)

# Stap 5
python3 generate_distractors.py          # in-place bijwerken
```

---

## Verschil met SM Periode 1 workflow

| Aspect | SM Periode 1 | HAN P2 THEO |
|--------|-------------|-------------|
| Bronformaat | CSV | Excel (.xlsx) |
| Kwaliteitsfilter | `oordeel` ∈ {GOED, EXCELLENT} | score-drempel per dimensie |
| Stap 1 opschonen | Ja (`head`) | Nee |
| Stap 4 stellingen | Ja | Nee (gefilterd) |
| Stap 2 script | Inline Python | `step2_sample_han.py` |
| Model | `claude-sonnet-4-5-20250929` | `claude-sonnet-4-6` |
| Originele bronvragen | `sample_40_vragen.csv` | `sample_40_han.csv` |
| Gegenereerde toets | `sample_40_vragen_nieuw.csv` | `sample_40_han_nieuw.csv` |
