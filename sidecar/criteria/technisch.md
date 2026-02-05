# Criteria Technische Kwaliteit

## Definitie
De technische kwaliteit beoordeelt de constructie van de vraag zelf: stam, correct antwoord en afleiders.

---

## Kwantitatieve Data (al beschikbaar)

De volgende technische aspecten zijn **al gemeten** door de deterministische analyzer en staan in `tech_kwant_*` kolommen. Je hoeft deze NIET opnieuw te beoordelen:

| Kolom | Beschrijving | Actie voor AI |
|-------|--------------|---------------|
| `tech_kwant_longest_bias` | True als correct antwoord >50% langer is | **Gebruik als input** |
| `tech_kwant_homogeneity_score` | 0-1, lager = meer lengteverschil | **Gebruik als input** |
| `tech_kwant_absolute_terms_correct` | Absolute termen in correct antwoord | **Gebruik als input** |
| `tech_kwant_absolute_terms_distractors` | Absolute termen in afleiders | **Gebruik als input** |
| `tech_kwant_negation_detected` | Ontkenning gevonden in stam | **Gebruik als input** |
| `tech_kwant_negation_emphasized` | Ontkenning in hoofdletters/vet | **Gebruik als input** |
| `tech_kwant_flags` | Automatisch gedetecteerde problemen | **Gebruik als input** |

**Jouw taak als AI**: Voeg KWALITATIEVE beoordeling toe die niet automatisch meetbaar is.

---

## Beoordelingscriteria

### 1. De Stam (Vraag)

| Criterium | Goed | Probleem |
|-----------|------|----------|
| **Helderheid** | Ondubbelzinnig, student weet exact wat gevraagd wordt | Vaag, meerdere interpretaties mogelijk |
| **Volledigheid** | Bevat het complete probleem | Student moet eerst opties lezen om vraag te begrijpen |
| **Geen hints** | Geen onbedoelde aanwijzingen naar correct antwoord | Taalkundige of logische hints aanwezig |
| **Ontkenningen** | Geen ontkenningen, of duidelijk benadrukt (NIET, GEEN) | Ontkenning zonder nadruk, verwarrend |

### 2. Het Correcte Antwoord

| Criterium | Goed | Probleem |
|-----------|------|----------|
| **Onbetwistbaar** | Feitelijk en verifieerbaar correct | Discutabel of contextafhankelijk |
| **Specifiek** | Direct antwoord op de vraag | Te algemeen of indirect |

### 3. De Afleiders (Distractors)

| Criterium | Goed | Probleem |
|-----------|------|----------|
| **Plausibiliteit** | Aantrekkelijk voor wie stof niet beheerst | Overduidelijk fout of "grapjes" |
| **Duidelijk fout** | Voor competente student herkenbaar als fout | Discutabel of deels juist |
| **Homogeniteit** | Vergelijkbaar qua lengte, stijl, complexiteit | Correct antwoord springt eruit |
| **Geen absoluten** | Vermijdt "altijd", "nooit", "alle", "geen" | Bevat absolute termen (vaak fout) |

## AI-specifieke Beoordeling (niet automatisch meetbaar)

Focus op deze patronen die ALLEEN door AI beoordeeld kunnen worden:

1. **Plausibiliteit afleiders**: Zijn de foute antwoorden geloofwaardig voor studenten die de stof niet beheersen?
2. **Flauwekul-opties**: Zijn er afleiders die niemand serieus neemt?
3. **"Alle bovenstaande"**: Is er een complexe optie die testwijsheid beloont?
4. **Grammaticale hints**: Past het correct antwoord grammaticaal beter bij de stam?
5. **Semantische helderheid stam**: Is de vraag duidelijk zonder de opties te lezen?

**NIET beoordelen** (al gedaan door deterministic_analyzer.py):
- Langste antwoord bias → zie `tech_kwant_longest_bias`
- Homogeniteit antwoordlengtes → zie `tech_kwant_homogeneity_score`
- Absolute termen → zie `tech_kwant_absolute_terms_*`
- Ontkenning benadrukt → zie `tech_kwant_negation_emphasized`

## Scoringsmethodiek

Geef een score van 1-5:

| Score | Label | Beschrijving |
|-------|-------|--------------|
| 5 | Excellent | Perfecte stam, correct antwoord en afleiders |
| 4 | Goed | Kleine verbeterpunten, geen majeure problemen |
| 3 | Voldoende | Functioneel maar verbeterbaar |
| 2 | Matig | Significante problemen met stam of afleiders |
| 1 | Onvoldoende | Fundamentele constructieproblemen |

## Output Format

Voor elke vraag, lever:
- `tech_kwal_stam_score`: 1-5
- `tech_kwal_afleiders_score`: 1-5
- `tech_kwal_score`: 1-5 (gewogen gemiddelde)
- `tech_problemen`: Komma-gescheiden lijst van gedetecteerde problemen
- `tech_toelichting`: Korte motivatie (max 50 woorden)
