# MC Toetsvalidatie & Generatie Platform

Een AI-gestuurd webplatform voor het valideren en genereren van meerkeuzetoetsvragen voor het Nederlandse hoger onderwijs.

## Doel

Dit platform ondersteunt docenten en toetsontwerpers bij het bewaken en verbeteren van de kwaliteit van multiple-choice toetsvragen. Via twee modules — validatie en generatie — worden toetsvragen automatisch beoordeeld op kwaliteitsdimensies en kunnen nieuwe vragen worden gegenereerd op basis van studiemateriaal.

## Modules

### Module A — Toetsvalidatie
- **Upload**: Laad bestaande MC-vragen up (CSV/Excel/QTI).
- **Automatische Analyse**: Deterministisch + LLM-gebaseerde beoordeling op drie kwaliteitsdimensies: validiteit, betrouwbaarheid en technische kwaliteit.
- **Dashboard**: Overzicht van alle vragen met kwaliteitsscores en verbeteringsuggesties per vraag.
- **Export**: Exporteer de geanalyseerde vragen en rapporten.

### Module B — Toetsgeneratie
- **Upload Studiemateriaal**: Laad leerteksten of andere bronnen up.
- **RAG-gedreven Generatie**: Automatisch genereren van MC-vragen op basis van de inhoud via Retrieval-Augmented Generation.
- **Kwaliteitscheck**: Gegenereerde vragen worden automatisch beoordeeld op kwaliteitscriteria.
- **Docentreview**: Docenten beoordelen en bewerken de gegenereerde vragen voor export.
- **Export**: Vragen exporteren naar gewenste format.

## Kwaliteitsdimensies

De validatie beoordeelt vragen op drie dimensies, elk met specifieke criteria:
- **Validiteit**: Cognitief niveau (Bloom's taxonomie), constructvaliditeit, aansluiting op leerdoelen.
- **Betrouwbaarheid**: Discriminerend vermogen, helderheid, afwezigheid van ambiguïteit.
- **Technische Kwaliteit**: Lengte-bias, absolute termen, negaties, homogeniteit van opties.

## Technologie

De applicatie is gebouwd met React, TypeScript en Tailwind CSS (frontend), met een Python-gebaseerde sidecar-service voor AI/LLM-verwerking. De backend maakt gebruik van embeddings voor semantische zoekfunctionaliteit en is gedeployed via Cloud Run en GitHub Pages.

## Live Demo

Bekijk de applicatie op: [businessdatasolutions.github.io/mc-toetsgenerator](https://businessdatasolutions.github.io/mc-toetsgenerator/)
