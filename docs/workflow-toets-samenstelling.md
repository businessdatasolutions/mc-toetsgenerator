# Handboek Toetssamenstelling: MC-vragen via AI

## 1. Inleiding

Dit handboek beschrijft hoe je met behulp van AI (Claude API) kwalitatief hoogwaardige multiple-choice toetsvragen genereert, beoordeelt en samenstelt. Het is bedoeld voor toetsontwerpers in het hoger onderwijs.

**Leeswijzer:**

- **§2 Kwaliteitskader** — de inhoudelijke maatstaf: welke eisen stellen we aan MC-vragen?
- **§3 Voorbeelden** — concrete goede en slechte vragen met analyse
- **§4 Workflow** — de technische stappen om van vragenbank naar toets te komen

Items gemarkeerd met ⚑ zijn aanscherpingen op basis van docentfeedback op AI-gegenereerde vragen.

---

## 2. Kwaliteitskader MC-vragen

### 2.1 Drie kwaliteitsdimensies

Elke MC-vraag wordt onafhankelijk beoordeeld op drie dimensies. Er is geen samengestelde score — elke dimensie levert een eigen 1-5 beoordeling op.

| Dimensie | Kernvraag |
|----------|-----------|
| **Validiteit** | Meet de vraag wat je beoogt te meten? |
| **Betrouwbaarheid** | Levert de vraag consistente en nauwkeurige resultaten op? |
| **Technische kwaliteit** | Is de vraag goed geconstrueerd (stam, antwoord, afleiders)? |

---

### 2.2 Validiteit

Validiteit beantwoordt de vraag: **meet de toets wat je beoogt te meten?** Een valide MC-toets reflecteert de leerdoelen van de cursus. Als de leerdoelen gericht zijn op 'toepassen', maar de toets vraagt alleen 'feitenkennis', dan is de toets niet valide.

#### Cognitief niveau (Bloom's Taxonomy)

| Niveau | Beschrijving | Voorbeeldwerkwoorden |
|--------|--------------|---------------------|
| **Onthouden** | Feiten reproduceren | benoemen, opsommen, definiëren |
| **Begrijpen** | Betekenis uitleggen | uitleggen, samenvatten, vergelijken |
| **Toepassen** | Kennis gebruiken in nieuwe situatie | toepassen, demonstreren, gebruiken |
| **Analyseren** | Onderdelen onderscheiden, relaties leggen | analyseren, onderscheiden, relateren |

#### Leerdoelalignment

De vraag moet kernconcepten toetsen, niet triviale details. Het cognitief niveau moet passen bij wat het leerdoel vereist.

#### Validiteitsproblemen detecteren

1. **Te laag cognitief niveau**: Vraag toetst alleen feitenkennis terwijl leerdoelen toepassing vereisen
2. **Irrelevante details**: Vraag focust op triviale details in plaats van kernconcepten
3. **Contextmismatch**: Vraag past niet bij het vakgebied of de praktijkcontext

#### ⚑ Passende moeilijkheidsgraad

Zorg dat de vraag als geheel (stam + afleiders) onderscheidend is voor het beoogde cognitieve niveau. Ook "onthouden"-vragen moeten plausibele afleiders hebben — een te makkelijke vraag levert geen bruikbare meetinformatie op.

#### ⚑ Geen onderwerpdubbeling in batch

Voorkom dat twee of meer vragen in dezelfde batch hetzelfde concept toetsen, tenzij op een significant ander cognitief niveau (bijv. onthouden vs. toepassen).

#### Scoringsmethodiek

| Score | Label | Beschrijving |
|-------|-------|--------------|
| 5 | Excellent | Toetst op passend cognitief niveau, kernstof |
| 4 | Goed | Toetst kernstof, niveau is adequaat |
| 3 | Voldoende | Toetst relevante stof, niveau kan hoger |
| 2 | Matig | Toetst te laag niveau of irrelevante details |
| 1 | Onvoldoende | Toetst niet wat beoogd |

#### Output format

- `val_cognitief_niveau`: Onthouden / Begrijpen / Toepassen / Analyseren
- `val_score`: 1-5
- `val_toelichting`: Korte motivatie (max 50 woorden)

---

### 2.3 Betrouwbaarheid

Betrouwbaarheid gaat over de **consistentie** en **nauwkeurigheid** van de meting. Als een student de toets onder dezelfde omstandigheden opnieuw zou maken, zou de score dan ongeveer hetzelfde zijn? Een onbetrouwbare toets wordt sterk beïnvloed door toeval (gokken, onduidelijke vragen).

#### Discriminerend vermogen

Kan de vraag onderscheid maken tussen studenten die de stof beheersen en studenten die dat niet doen?

- **Hoog**: Alleen studenten met kennis kunnen correct antwoorden
- **Laag**: Iedereen kan correct antwoorden (te makkelijk) of niemand (te moeilijk)
- **Geen**: Vraag test iets anders dan kennis (bijv. leesvaardigheid, gokkans)

#### Ambiguïteit

Zijn er meerdere verdedigbare antwoorden mogelijk?

- **Geen ambiguïteit**: Eén duidelijk correct antwoord
- **Lichte ambiguïteit**: Kleine interpretatieruimte
- **Hoge ambiguïteit**: Meerdere antwoorden verdedigbaar

#### Gokkansreductie

Worden studenten die gokken effectief afgestraft door plausibele afleiders?

#### ⚑ Afleiders niet elimineerbaar zonder vakkennis

Afleiders mogen niet op basis van algemene kennis of logisch redeneren alleen al uitgesloten kunnen worden. Als een student zonder vakkennis meerdere opties direct kan wegstrepen, daalt het discriminerend vermogen en stijgt de effectieve gokkans.

#### ⚑ Correct antwoord niet te voor de hand liggend

Het correcte antwoord mag niet zo vanzelfsprekend zijn dat het geen onderscheidend vermogen heeft. Als het juiste antwoord al op basis van intuïtie of common sense te identificeren is, meet de vraag geen vakkennis.

#### Betrouwbaarheidsproblemen detecteren

1. **Plafondeffect**: Vraag is zo makkelijk dat iedereen correct antwoordt
2. **Vloereffect**: Vraag is zo moeilijk dat niemand correct antwoordt
3. **Ambigue vraagstelling**: Meerdere interpretaties mogelijk
4. **Meerdere juiste antwoorden**: Meer dan één antwoord is verdedigbaar

#### Scoringsmethodiek

| Score | Label | Beschrijving |
|-------|-------|--------------|
| 5 | Excellent | Hoog discriminerend, geen ambiguïteit |
| 4 | Goed | Goed discriminerend, minimale ambiguïteit |
| 3 | Voldoende | Redelijk discriminerend |
| 2 | Matig | Laag discriminerend of ambigue |
| 1 | Onvoldoende | Geen discriminatie of meerdere juiste antwoorden |

#### Output format

- `bet_discriminatie`: Hoog / Gemiddeld / Laag / Geen
- `bet_ambiguiteit`: Geen / Licht / Hoog
- `bet_score`: 1-5
- `bet_toelichting`: Korte motivatie (max 50 woorden)

---

### 2.4 Technische kwaliteit

De technische kwaliteit beoordeelt de constructie van de vraag zelf: stam, correct antwoord en afleiders.

#### De stam

| Criterium | Goed | Probleem |
|-----------|------|----------|
| **Helderheid** | Ondubbelzinnig, student weet exact wat gevraagd wordt | Vaag, meerdere interpretaties mogelijk |
| **Volledigheid** | Bevat het complete probleem | Student moet eerst opties lezen om vraag te begrijpen |
| **Geen hints** | Geen onbedoelde aanwijzingen naar correct antwoord | Taalkundige of logische hints aanwezig |
| **Ontkenningen** | Geen ontkenningen, of duidelijk benadrukt (NIET, GEEN) | Ontkenning zonder nadruk, verwarrend |

**⚑ Aanscherpingen uit docentfeedback:**

- **Antwoord niet weggeven in de stam.** De stam mag geen sleutelbegrippen bevatten die direct naar het juiste antwoord leiden — ook geen synoniemen, vertalingen of parafrases. Voorbeeld 1: als de vraag gaat over "gedeelde waarden" in het 7S-model, noem die term dan niet in de stam. Voorbeeld 2: vraag niet naar "zwakheden" als het antwoord "interne verbeterpunten" is — gebruik dan "de W uit de SWOT-analyse" zodat de student zelf moet weten waarvoor de letter staat.
- **Beknopte zinnen.** Houd zinnen in de stam beknopt (max ~25 woorden per zin). Splits lange scenario's op in meerdere korte zinnen. Lange, complexe zinnen maken de vraag moeilijk leesbaar zonder de moeilijkheidsgraad inhoudelijk te verhogen.
- **Gebruik vaktermen.** Gebruik standaard vaktermen (bijv. "organogram", "machinebureaucratie") in plaats van omslachtige omschrijvingen. Omslachtige beschrijvingen maken de vraag gekunsteld en onnodig lang.

#### Het correcte antwoord

| Criterium | Goed | Probleem |
|-----------|------|----------|
| **Onbetwistbaar** | Feitelijk en verifieerbaar correct | Discutabel of contextafhankelijk |
| **Specifiek** | Direct antwoord op de vraag | Te algemeen of indirect |

#### De afleiders

| Criterium | Goed | Probleem |
|-----------|------|----------|
| **Plausibiliteit** | Aantrekkelijk voor wie stof niet beheerst | Overduidelijk fout of "grapjes" |
| **Duidelijk fout** | Voor competente student herkenbaar als fout | Discutabel of deels juist |
| **Logische integriteit** | Opties zijn wederzijds uitsluitend — precies één antwoord kan correct zijn | Meerdere opties zijn tegelijk waar, of opties overlappen logisch |
| **Homogeniteit** | Vergelijkbaar qua lengte, stijl, complexiteit. **Uitzondering:** bij korte antwoorden (1-2 woorden) mag de lengte meer variëren | Correct antwoord springt eruit |
| **Geen absoluten** | Vermijdt "altijd", "nooit", "alle", "geen" | Bevat absolute termen (vaak fout) |

**Voorbeeld logische integriteitsschending:**

```
A) Stelling 1 is juist
B) Stelling 2 is juist
C) Stelling 1 en 2 zijn onjuist
D) Stelling 1 en 2 zijn juist       ← correct antwoord
```

Als D correct is, zijn A en B automatisch ook waar. **Oplossing:** A en B hadden moeten luiden "*Uitsluitend* stelling 1/2 is juist".

**⚑ Aanscherpingen uit docentfeedback:**

- **Zelfde conceptuele domein.** Afleiders moeten uit hetzelfde model, theorie of begrippencluster komen als het correcte antwoord. Bij een vraag over een specifiek element uit het 7S-model: gebruik andere 7S-elementen die semantisch dichtbij liggen (bijv. Skills, Staff), niet elementen uit een ander domein (bijv. Structuur, Systemen).
- **Plausibel bij oppervlakkige kennis.** Elke afleider moet aantrekkelijk zijn voor een student die de stof globaal kent maar het concept niet diep begrijpt. De afleider moet "klinken alsof het zou kunnen kloppen".
- **Niet discutabel.** Afleiders mogen niet gedeeltelijk correct of ambigu zijn — ze moeten eenduidig onjuist zijn. Als een afleider verdedigbaar is, ondermijnt dat de betrouwbaarheid van de meting.
- **Specifiek genoeg.** Afleiders mogen niet te breed of vaag zijn — ze moeten concreet genoeg zijn om als serieus alternatief te fungeren.
- **Geen triviale opties.** Vermijd absurde of onzinnige antwoorden die niemand serieus zou overwegen.
- **Homogeen in lengte en stijl.** Afleiders moeten qua woordenaantal (±20%) en taalstijl vergelijkbaar zijn met het correcte antwoord.
- **⚑ Misconceptie-gerichtheid.** Elke afleider vertegenwoordigt een specifieke, veelvoorkomende studentmisconceptie of typische redeneerfout — niet een willekeurige permutatie of abstracte variatie van het correcte antwoord. Voorbeeld: bij een vraag over het primaire proces van een accountantskantoor, gebruik concrete processen die studenten verwarren met het primaire proces (zoals facturering of training), niet abstracte omschrijvingen van input/output-rollen.
- **⚑ Concreetheid.** Antwoordopties zijn bij voorkeur concrete, herkenbare voorbeelden of scenario's in plaats van abstracte, theoretische omschrijvingen. Concrete opties testen of de student het concept kan herkennen in de praktijk.

#### Deterministische checks (al automatisch gemeten)

De volgende technische aspecten zijn al gemeten door de deterministische analyzer en staan in `tech_kwant_*` kolommen. Deze hoeven niet opnieuw beoordeeld te worden:

| Kolom | Beschrijving |
|-------|--------------|
| `tech_kwant_longest_bias` | True als correct antwoord >50% langer is |
| `tech_kwant_homogeneity_score` | 0-1, lager = meer lengteverschil |
| `tech_kwant_absolute_terms_correct` | Absolute termen in correct antwoord |
| `tech_kwant_absolute_terms_distractors` | Absolute termen in afleiders |
| `tech_kwant_negation_detected` | Ontkenning gevonden in stam |
| `tech_kwant_negation_emphasized` | Ontkenning in hoofdletters/vet |
| `tech_kwant_flags` | Automatisch gedetecteerde problemen |

#### AI-specifieke beoordeling (niet automatisch meetbaar)

Focus op deze patronen die alleen door AI beoordeeld kunnen worden:

1. **Plausibiliteit afleiders**: Zijn de foute antwoorden geloofwaardig voor studenten die de stof niet beheersen?
2. **Flauwekul-opties**: Zijn er afleiders die niemand serieus neemt?
3. **"Alle bovenstaande"**: Is er een complexe optie die testwijsheid beloont?
4. **Grammaticale hints**: Past het correct antwoord grammaticaal beter bij de stam?
5. **Semantische helderheid stam**: Is de vraag duidelijk zonder de opties te lezen?
6. **Logische integriteit**: Zijn de opties wederzijds uitsluitend? Controleer vooral bij stellingvragen of combinatie-opties niet logisch overlappen met individuele opties.

#### Scoringsmethodiek

| Score | Label | Beschrijving |
|-------|-------|--------------|
| 5 | Excellent | Perfecte stam, correct antwoord en afleiders |
| 4 | Goed | Kleine verbeterpunten, geen majeure problemen |
| 3 | Voldoende | Functioneel maar verbeterbaar |
| 2 | Matig | Significante problemen met stam of afleiders |
| 1 | Onvoldoende | Fundamentele constructieproblemen |

#### Output format

- `tech_kwal_stam_score`: 1-5
- `tech_kwal_afleiders_score`: 1-5
- `tech_kwal_score`: 1-5 (gewogen gemiddelde)
- `tech_problemen`: Komma-gescheiden lijst van gedetecteerde problemen
- `tech_toelichting`: Korte motivatie (max 50 woorden)

---

## 3. Voorbeelden

### 3.1 Slecht opgestelde MC-vragen

#### Voorbeeld 1 — Afleiders uit verkeerd semantisch domein

**Stam:** Binnen het 7S-model van McKinsey verwijst één van de zeven elementen naar het gedrag en de houding van het management tegenover medewerkers. Hoe wordt dit element genoemd?

| Optie | Antwoord |
|-------|----------|
| A | Stijl ✓ |
| B | Structuur ✗ |
| C | Strategie ✗ |
| D | Systemen ✗ |

**Docentfeedback:** *"Makkelijke vraag en makkelijke afleiders. Wellicht beter Skills of Staff als optie toevoegen ipv Structuur en Systemen."*

**Analyse:** De afleiders (Structuur, Strategie, Systemen) gaan duidelijk niet over gedrag/houding van management. Skills of Staff liggen semantisch dichter bij het juiste antwoord en dwingen de student tot nadenken. *(Schendt §2.4 Afleiders: zelfde conceptuele domein)*

---

#### Voorbeeld 2 — Antwoord weggegeven in de stam

**Stam:** Een organisatieadviseur legt aan een groep eerstejaars studenten uit hoe het 7S-model van McKinsey werkt. Ze legt daarbij de nadruk op het centrale element van het model. Wat is de functie van dit centrale element — de gedeelde waarden — binnen het 7S-model?

| Optie | Antwoord |
|-------|----------|
| A | Ze sturen het gedrag van medewerkers en bepalen de cultuur binnen de organisatie ✓ |
| B | Ze beschrijven de formele structuur van de organisatie en leggen de verdeling van taken en bevoegdheden vast ✗ |
| C | Ze verbinden de strategie van de organisatie met de operationele doelstellingen en maken deze meetbaar voor het management ✗ |
| D | Ze vormen de basis voor het aantrekken en ontwikkelen van medewerkers met de juiste competenties en vaardigheden ✗ |

**Docentfeedback:** *"Redelijk makkelijke vraag, wellicht naam van het centrale element niet in de vraag benoemen. Makkelijke afleiders."*

**Analyse:** De stam noemt expliciet "de gedeelde waarden", waardoor de student al weet welk element bedoeld wordt. De vraag toetst dan alleen nog de functie, niet de herkenning van het element. *(Schendt §2.4 Stam: antwoord niet weggeven)*

---

#### Voorbeeld 3 — Gekunstelde omschrijving i.p.v. vakterm

**Stam:** Een nieuwe medewerker bij een middelgroot logistiek bedrijf krijgt tijdens haar introductie een schematische tekening te zien van de organisatie. Daarin staan vakjes met functienamen en lijnen die de vakjes met elkaar verbinden. Wat laat dit schema haar primair zien?

| Optie | Antwoord |
|-------|----------|
| A | Welke taken elke medewerker dagelijks uitvoert en hoeveel tijd daarvoor staat ✗ |
| B | Welke afdelingen er zijn en wie verantwoording aflegt aan wie ✓ |
| C | Hoe de werkprocessen binnen de organisatie stap voor stap verlopen ✗ |
| D | Welke strategische doelen de organisatie nastreeft en wie daarvoor verantwoordelijk is ✗ |

**Docentfeedback:** *"Gekunstelde vraag, beter gewoon de naam organogram gebruiken. Afleiders te makkelijk."*

**Analyse:** De omslachtige beschrijving ("vakjes met functienamen en lijnen") maakt de vraag onnodig lang en gekunsteld. Gebruik gewoon de vakterm "organogram". *(Schendt §2.4 Stam: gebruik vaktermen)*

---

#### Voorbeeld 4 — Te lange stam, slechte leesbaarheid

**Stam:** Een productiebedrijf heeft een systeem ingevoerd dat automatisch bijhoudt of de dagelijkse output overeenkomt met de vooraf vastgestelde doelstellingen en kwaliteitsnormen. Welke managementfunctie vervult dit systeem binnen de organisatie?

| Optie | Antwoord |
|-------|----------|
| A | Het opstellen van concrete doelstellingen en kwaliteitsnormen voor de dagelijkse productie ✗ |
| B | Het coördineren van de samenwerking tussen medewerkers om de productiedoelen te realiseren ✗ |
| C | Het toewijzen van middelen en taken aan de juiste afdelingen binnen het productieproces ✗ |
| D | Het bewaken of de werkelijke resultaten overeenkomen met de vastgestelde normen ✓ |

**Docentfeedback:** *"Vraag moeilijk leesbaar door lange eerste zin. Afleiders vrij makkelijk."*

**Analyse:** De eerste zin is te lang en complex. De afleiders zijn bovendien te makkelijk te elimineren. *(Schendt §2.4 Stam: beknopte zinnen + §2.3 Betrouwbaarheid: afleiders niet elimineerbaar zonder vakkennis)*

---

#### Voorbeeld 5 — Correct antwoord te voor de hand liggend

**Stam:** Een productiebedrijf analyseert zijn processen vanuit Lean-perspectief. Welke van de volgende activiteiten wordt binnen Lean beschouwd als waarde-toevoegend en dus NIET als verspilling?

| Optie | Antwoord |
|-------|----------|
| A | Het monteren van onderdelen tot een eindproduct waarvoor de klant betaalt ✓ |
| B | Het controleren van producten op kwaliteitsfouten voordat ze naar de klant worden verzonden ✗ |
| C | Het opslaan van halffabricaten in het magazijn om te zorgen dat de productie soepel doorloopt ✗ |
| D | Het intern transporteren van grondstoffen van de opslaglocatie naar de productievloer ✗ |

**Docentfeedback:** *"Goede antwoord is te makkelijk, afleiders choice3 en choice4 vrij makkelijk."*

**Analyse:** "Monteren" is zo duidelijk waarde-toevoegend dat de vraag geen onderscheidend vermogen heeft. "Opslaan" en "transporteren" zijn klassieke Lean-verspillingen die ook zonder diepgaande kennis herkenbaar zijn. *(Schendt §2.3 Betrouwbaarheid: correct antwoord niet te voor de hand liggend + afleiders niet elimineerbaar zonder vakkennis)*

---

### 3.2 Goed opgestelde MC-vragen

#### Voorbeeld 1 — Plausibele afleiders uit zelfde raamwerk

**Stam:** Een bedrijfskundestudent bestudeert het VRIO-raamwerk. Wat is de centrale vraag die hoort bij de eerste letter van dit model?

| Optie | Antwoord |
|-------|----------|
| A | Levert de resource een bijdrage aan het voldoen aan de behoeften van klanten of het benutten van kansen in de markt? ✓ |
| B | Beschikt de organisatie over voldoende financiële middelen om de resource op lange termijn te onderhouden en verder te ontwikkelen? ✗ |
| C | Is de resource moeilijk te imiteren door concurrenten, zodat de organisatie een duurzaam concurrentievoordeel kan behouden? ✗ |
| D | Beschikt de organisatie over de juiste processen en structuren om de resource effectief in te zetten voor het behalen van strategische doelen? ✗ |

**Docentfeedback:** *"oké"*

**Analyse:** Alle afleiders gaan over resource-gerelateerde vragen die binnen het VRIO-raamwerk passen. Afleider C beschrijft de I (Imitability) en D de O (Organization) — studenten moeten echt weten welke vraag bij welke letter hoort. *(Voldoet aan §2.4 Afleiders: zelfde conceptuele domein, plausibel, niet elimineerbaar zonder vakkennis)*

---

#### Voorbeeld 2 — Helder scenario met plausibele alternatieven

**Stam:** Een productiebedrijf dat keukenmachines assembleert, merkt dat er regelmatig grote voorraden halffabrikaten opstapelen tussen de verschillende productiestations. Hierdoor lopen de doorlooptijden op en ontstaan er vertragingen bij de levering aan klanten. De operationeel manager wil het productieproces verbeteren volgens LEAN-principes. Welke aanpak sluit hier het beste op aan?

| Optie | Antwoord |
|-------|----------|
| A | De capaciteit van elk productiestation verhogen door meer medewerkers in te zetten zodat de voorraden sneller worden verwerkt ✗ |
| B | De productie opdelen in kleinere series zodat halffabrikaten sneller doorstromen naar het volgende station ✓ |
| C | Een centraal voorraadpunt inrichten tussen de productiestations zodat halffabrikaten gecontroleerd worden opgeslagen en gebufferd ✗ |
| D | De productieplanning optimaliseren door grotere series tegelijk te produceren zodat omsteltijden tussen de stations worden verminderd ✗ |

**Docentfeedback:** *"oké"*

**Analyse:** Alle afleiders zijn logisch klinkende bedrijfskundige oplossingen. Afleider A (meer capaciteit) en D (grotere series) zijn plausibele maar niet-Lean-oplossingen. Afleider C gaat juist tegen het Lean-principe in (buffering = verspilling), maar klinkt voor een onoplettende student als een redelijke aanpak. *(Voldoet aan §2.4 Afleiders: zelfde conceptuele domein, plausibel, specifiek + §2.3 Betrouwbaarheid: hoog discriminerend vermogen)*

---

#### Voorbeeld 3 — Subtiele fout in afleider vereist goed lezen

**Stam:** Een groot productiebedrijf werkt met strakke protocollen, vaste taakomschrijvingen en uitgebreide goedkeuringsprocedures. Welk nadeel hoort kenmerkend bij dit type organisatie-inrichting?

| Optie | Antwoord |
|-------|----------|
| A | De organisatie heeft moeite om medewerkers te motiveren, omdat vaste taakomschrijvingen zorgen voor te veel autonomie en onduidelijkheid over verantwoordelijkheden ✗ |
| B | De organisatie heeft moeite om snel in te spelen op veranderingen in de omgeving door de vele vaste procedures ✓ |
| C | De organisatie kampt met hoge productiekosten, omdat strakke protocollen leiden tot inefficiënte inzet van machines en grondstoffen ✗ |
| D | De organisatie heeft moeite om eenheid in de aansturing te bewaken, omdat uitgebreide goedkeuringsprocedures leiden tot versnippering van beslissingsbevoegdheden ✗ |

**Docentfeedback:** *"oké"*

**Analyse:** Afleider A bevat een subtiele fout ("te veel autonomie" — juist het omgekeerde is het geval bij strakke protocollen). De student moet goed lezen om dit te herkennen. Afleiders C en D klinken plausibel maar beschrijven geen kenmerkend nadeel van bureaucratische organisaties. *(Voldoet aan §2.4 Afleiders: plausibel, niet discutabel + §2.3 Betrouwbaarheid: hoog discriminerend vermogen)*

---

## 4. Workflow: van vragenbank naar toets

### 4.1 Overzicht

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

### 4.2 Vereisten

| Component | Details |
|-----------|---------|
| Bronbestand | CSV met beoordeelde MC-vragen, kolom `oordeel` (GOED/EXCELLENT), kolom `criterium_omschrijving` met wegingspercentage in haakjes |
| Python | 3.10+ |
| Packages | `anthropic` (`pip install anthropic`) |
| API-sleutel | `ANTHROPIC_API_KEY` als omgevingsvariabele (sla op in `.env.local`, staat in `.gitignore`) |

---

### 4.3 Stap 1 – Opschonen bronbestand

Verwijder lege of incomplete rijen onderaan het bronbestand (spreadsheet-artefacten).

```bash
# Behoud alleen de eerste N regels (1 header + N-1 datarijen)
head -822 bronbestand.csv > bronbestand_clean.csv
```

**Controle:** `wc -l bronbestand_clean.csv` moet het verwachte aantal regels tonen.

---

### 4.4 Stap 2 – Gestratificeerde aselecte steekproef

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

### 4.5 Stap 3 – Genereer nieuwe vraagvarianten

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

Kwaliteitseisen stam (zie §2.4):
- Geef het antwoord NIET weg in de vraagstelling — noem geen sleutelbegrippen die direct naar het juiste antwoord leiden
- Houd zinnen in de stam beknopt (max ~25 woorden per zin). Splits lange scenario's op in meerdere korte zinnen
- Gebruik standaard vaktermen (bijv. "organogram", "machinebureaucratie") in plaats van omslachtige omschrijvingen

Kwaliteitseisen afleiders (zie §2.4):
- Afleiders moeten uit hetzelfde conceptuele domein komen als het correcte antwoord (bijv. bij een vraag over een specifiek element uit het 7S-model, gebruik andere 7S-elementen die semantisch dichtbij liggen)
- Elke afleider moet plausibel klinken voor een student die de stof oppervlakkig kent maar het concept niet diep begrijpt
- Afleiders mogen NIET discutabel of gedeeltelijk correct zijn — ze moeten eenduidig onjuist zijn
- Afleiders mogen niet op basis van algemene kennis (zonder vakkennis) al uitgesloten kunnen worden
- Elke afleider vertegenwoordigt een specifieke studentmisconceptie of typische redeneerfout — geen willekeurige permutaties of abstracte variaties
- Gebruik bij voorkeur concrete voorbeelden of scenario's als antwoordopties, geen abstracte theoretische omschrijvingen
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

### 4.6 Stap 4 – Converteer stellingvragen naar reguliere MC

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

### 4.7 Stap 5 – Genereer afleiders

Voeg drie plausibele, kwalitatieve afleiders toe per vraag. Randomiseer de positie van het correcte antwoord.

**Model:** `claude-sonnet-4-5-20250929`
**Temperature:** `0.5`

**Kwaliteitseisen afleiders** (zie §2.3 en §2.4 voor volledige toelichting):

| Criterium | Eis |
|-----------|-----|
| Zelfde conceptueel domein | Afleiders komen uit hetzelfde model/theorie/begrippencluster als het correcte antwoord |
| Plausibiliteit | Aantrekkelijk voor wie de stof niet beheerst |
| Niet discutabel | Eenduidig onjuist, geen overlap met correct antwoord |
| Niet elimineerbaar zonder vakkennis | Niet uitsluitbaar op basis van algemene kennis alleen |
| Homogeniteit | Vergelijkbaar in lengte en stijl met correct antwoord (±20% woorden) |
| Logische integriteit | Wederzijds uitsluitend, geen overlap |
| Geen absolute termen | Vermijd "altijd", "nooit", "alle", "geen" |
| Geen triviale opties | Geen absurde of onzinnige antwoorden |

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

### 4.8 Eindresultaat

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

### 4.9 Scripts overzicht

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
