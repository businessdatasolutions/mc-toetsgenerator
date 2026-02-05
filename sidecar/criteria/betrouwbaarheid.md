# Criteria Betrouwbaarheid (Reliability)

## Definitie
Betrouwbaarheid gaat over de **consistentie** en **nauwkeurigheid** van de meting.

Als een student de toets onder dezelfde omstandigheden opnieuw zou maken, zou de score dan ongeveer hetzelfde zijn? Een onbetrouwbare toets wordt sterk beïnvloed door toeval (gokken, onduidelijke vragen).

## Beoordelingscriteria

### Discriminerend Vermogen
Kan de vraag onderscheid maken tussen studenten die de stof beheersen en studenten die dat niet doen?

- **Hoog**: Alleen studenten met kennis kunnen correct antwoorden
- **Laag**: Iedereen kan correct antwoorden (te makkelijk) of niemand (te moeilijk)
- **Geen**: Vraag test iets anders dan kennis (bijv. leesvaardigheid, gokkans)

### Ambiguïteit
Zijn er meerdere verdedigbare antwoorden mogelijk?

- **Geen ambiguïteit**: Eén duidelijk correct antwoord
- **Lichte ambiguïteit**: Kleine interpretatieruimte
- **Hoge ambiguïteit**: Meerdere antwoorden verdedigbaar

### Gokkans-reductie
Worden studenten die gokken effectief afgestraft door plausibele afleiders?

## Betrouwbaarheidsproblemen detecteren

1. **Plafondeffect**: Vraag is zo makkelijk dat iedereen correct antwoordt
2. **Vloereffect**: Vraag is zo moeilijk dat niemand correct antwoordt
3. **Ambigue vraagstelling**: Meerdere interpretaties mogelijk
4. **Meerdere juiste antwoorden**: Meer dan één antwoord is verdedigbaar

## Scoringsmethodiek

Geef een score van 1-5:

| Score | Label | Beschrijving |
|-------|-------|--------------|
| 5 | Excellent | Hoog discriminerend, geen ambiguïteit |
| 4 | Goed | Goed discriminerend, minimale ambiguïteit |
| 3 | Voldoende | Redelijk discriminerend |
| 2 | Matig | Laag discriminerend of ambigue |
| 1 | Onvoldoende | Geen discriminatie of meerdere juiste antwoorden |

## Output Format

Voor elke vraag, lever:
- `bet_discriminatie`: Hoog / Gemiddeld / Laag / Geen
- `bet_ambiguiteit`: Geen / Licht / Hoog
- `bet_score`: 1-5
- `bet_toelichting`: Korte motivatie (max 50 woorden)
