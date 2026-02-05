# Criteria Validiteit (Validity)

## Definitie
Validiteit beantwoordt de vraag: **Meet de toets wat je beoogt te meten?**

Een valide MC-toets reflecteert de leerdoelen van de cursus of training. Als de leerdoelen gericht zijn op 'toepassen', maar de toets vraagt alleen 'feitenkennis', dan is de toets niet valide.

## Beoordelingscriteria

### Cognitief Niveau (Bloom's Taxonomy)
Beoordeel op welk niveau de vraag toetst:

| Niveau | Beschrijving | Voorbeeldwerkwoorden |
|--------|--------------|---------------------|
| **Onthouden** | Feiten reproduceren | benoemen, opsommen, definiëren |
| **Begrijpen** | Betekenis uitleggen | uitleggen, samenvatten, vergelijken |
| **Toepassen** | Kennis gebruiken in nieuwe situatie | toepassen, demonstreren, gebruiken |
| **Analyseren** | Onderdelen onderscheiden, relaties leggen | analyseren, onderscheiden, relateren |

### Validiteitsproblemen detecteren

1. **Te laag cognitief niveau**: Vraag toetst alleen feitenkennis terwijl leerdoelen toepassing vereisen
2. **Irrelevante details**: Vraag focust op triviale details in plaats van kernconcepten
3. **Contextmismatch**: Vraag past niet bij het vakgebied of de praktijkcontext

## Scoringsmethodiek

Geef een score van 1-5:

| Score | Label | Beschrijving |
|-------|-------|--------------|
| 5 | Excellent | Toetst op passend cognitief niveau, kernstof |
| 4 | Goed | Toetst kernstof, niveau is adequaat |
| 3 | Voldoende | Toetst relevante stof, niveau kan hoger |
| 2 | Matig | Toetst te laag niveau of irrelevante details |
| 1 | Onvoldoende | Toetst niet wat beoogd |

## Output Format

Voor elke vraag, lever:
- `val_cognitief_niveau`: Onthouden / Begrijpen / Toepassen / Analyseren
- `val_score`: 1-5
- `val_toelichting`: Korte motivatie (max 50 woorden)
