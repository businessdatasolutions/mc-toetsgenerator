# Kwaliteitsrapport: 40 AI-gegenereerde MC-vragen

**Bron:** `temp/sample_40_vragen_nieuw.csv`
**Beoordelingskader:** §2-3 uit `docs/workflow-toets-samenstelling.md`
**Datum:** 2026-03-05

---

## 1. Samenvatting

### Scoreverdeling

| Dimensie | Gem. | 5 | 4 | 3 | 2 | 1 |
|----------|------|---|---|---|---|---|
| **Validiteit** | 4,1 | 14 | 16 | 8 | 2 | 0 |
| **Betrouwbaarheid** | 3,8 | 8 | 17 | 10 | 5 | 0 |
| **Technische kwaliteit** | 4,0 | 10 | 19 | 9 | 2 | 0 |

### Opvallende patronen

1. **Onderwerpdubbeling:** Vraag 34 en 36 toetsen vrijwel identiek hetzelfde concept (meervoudige waardecreatie kenmerken) op hetzelfde Bloom-niveau (Analyseren). Eén van beide moet vervangen worden.
2. **Contingentiebenadering dubbeling:** Vraag 25 en 26 gaan beide over contingentiebenadering, maar op verschillend niveau (Begrijpen vs. Analyseren) — acceptabel.
3. **Leerdoel-mismatch:** Vraag 35 (cirkelorganisatie) en 37 (hybride werken) zijn gelabeld als Marketing maar betreffen organisatiestructuur/HRM.
4. **Bloom-niveau onevenwicht:** 18 van 40 vragen zijn op Begrijpen-niveau. Slechts 3 op Analyseren-niveau.
5. **Herhalend scenariopatroon:** Veel vragen gebruiken "een startup in duurzame mode" als context (vragen 5, 6, 9, 16) — meer variatie wenselijk.
6. **Afleiders met absolute termen:** In meerdere vragen bevatten afleiders woorden als "garandeert", "vervangt", "maximaliseren" die zonder vakkennis al verdacht zijn.

### Leerdoelverdeling

| Leerdoel | Aantal | Verwacht |
|----------|--------|----------|
| Strategisch management | 16 | 16 ✓ |
| Omgevingsanalyse | 6 | 6 ✓ |
| Marketing | 6 | 6 ✓ |
| Bedrijfskundige stromingen | 6 | 6 ✓ |
| Meervoudige waardecreatie | 6 | 6 ✓ |

---

## 2. Onderwerpdubbeling

| Paar | Concept | Bloom-niveaus | Oordeel |
|------|---------|---------------|---------|
| V34 + V36 | Meervoudige waardecreatie kenmerken | Analyseren + Analyseren | **⚠ Dubbeling** — vervang één |
| V25 + V26 | Contingentiebenadering | Begrijpen + Analyseren | ✓ OK — ander niveau |
| V2 + V5 | SWOT-analyse | Toepassen + Begrijpen | ✓ OK — ander aspect (kans vs. sterkte) |
| V12 + V21 | Marketingstrategie | Begrijpen + Toepassen | ✓ OK — ander type (gediff. vs. ongediff.) |
| V6 + V7 | Meervoudige waardecreatie begrip | Begrijpen + Begrijpen | **⚠ Grensgeval** — beide vragen "wat is MWC" |

---

## 3. Vraag-voor-vraag beoordeling

---

### Vraag 1 — Taylor-principe herkennen

**Leerdoel:** Bedrijfskundige stromingen | **Bloom:** Toepassen

**Stam:** Een meubelproducent laat zijn assemblagemedewerkers werken volgens gedetailleerde montage-instructies die door ingenieurs zijn opgesteld. Elke stap is voorgeschreven en medewerkers mogen niet afwijken van de procedures. Welk Taylor-principe wordt hier toegepast?

| Optie | Antwoord |
|-------|----------|
| A | Scheiding van planning en uitvoering door standaardisatie van werkprocessen ✓ |
| B | Toepassing van financiële prikkels door prestatiebeloning op basis van outputnormen |
| C | Selectie en training van medewerkers op basis van wetenschappelijke geschiktheidscriteria |
| D | Maximalisatie van efficiëntie door tijdstudies en eliminatie van onnodige bewegingen |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 5 |
| Technische kwaliteit | 5 |

**Toelichting:** Uitstekende vraag. De stam beschrijft een concreet scenario waarin de student het juiste Taylor-principe moet herkennen. Alle afleiders zijn authentieke Taylor-principes uit hetzelfde conceptueel domein. Hoge discriminatie: alleen wie de principes individueel kent, kan onderscheiden.

---

### Vraag 2 — SWOT: kans classificeren

**Leerdoel:** Strategisch management | **Bloom:** Toepassen

**Stam:** Een kledingwinkel in het centrum merkt dat steeds meer consumenten online winkelen en dat duurzaamheid een groeiende rol speelt bij aankoopbeslissingen. De winkel overweegt haar strategie aan te passen. Welk element zou in een SWOT-analyse als 'kans' (opportunity) moeten worden geclassificeerd?

| Optie | Antwoord |
|-------|----------|
| A | De verschuiving van fysieke winkels naar online shopping |
| B | De locatie van de winkel in het centrum van de stad |
| C | De huidige beperkte focus op duurzaamheid in het assortiment |
| D | De toenemende vraag naar duurzame kledingmerken ✓ |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede vraag met heldere stam. Afleiders vertegenwoordigen andere SWOT-categorieën (A=bedreiging, B=sterkte, C=zwakte). Kleine kanttekening: afleider A ("verschuiving naar online") zou ook als kans geïnterpreteerd kunnen worden als de winkel online gaat uitbreiden. Lichte ambiguïteit (§2.3).

---

### Vraag 3 — Ansoff-matrix doel

**Leerdoel:** Strategisch management | **Bloom:** Begrijpen

**Stam:** Een startup in sportvoeding wil de komende jaren groeien. De directeur vraagt jou als adviseur welk model zij kan gebruiken om systematisch te bepalen of ze beter kan inzetten op nieuwe producten, nieuwe markten, of een combinatie daarvan. Welk strategisch instrument raad je aan?

| Optie | Antwoord |
|-------|----------|
| A | De BCG-matrix, omdat dit model groeirichtingen op basis van marktaandeel en marktgroei analyseert |
| B | De SWOT-analyse, omdat dit model interne sterktes en zwaktes koppelt aan externe kansen en bedreigingen |
| C | Het concurrentiemodel van Porter, omdat dit model de aantrekkelijkheid van markten en sectoren bepaalt |
| D | De Ansoff-matrix, omdat dit model groeirichtingen op basis van product- en marktontwikkeling in kaart brengt ✓ |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 5 |
| Technische kwaliteit | 5 |

**Toelichting:** Uitstekende vraag. De stam beschrijft de behoefte zonder het antwoord te noemen. Afleiders zijn plausibele strategische modellen met elk een korte, correcte beschrijving van hun functie. Studenten moeten echt weten welk model specifiek over product/markt-groei gaat. Homogeen in lengte en stijl.

---

### Vraag 4 — Senge's disciplines

**Leerdoel:** Bedrijfskundige stromingen | **Bloom:** Toepassen

**Stam:** Een productiebedrijf introduceert een maandelijkse sessie waarin medewerkers openlijk hun aannames over klantbehoeften ter discussie stellen en bijstellen op basis van recente marktdata. Welke discipline van een lerende organisatie past het bedrijf hier toe?

| Optie | Antwoord |
|-------|----------|
| A | Persoonlijk meesterschap ontwikkelen |
| B | Mentale modellen uitdagen ✓ |
| C | Teamleren bevorderen |
| D | Systeemdenken toepassen |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 5 |

**Toelichting:** Sterke vraag. Alle afleiders zijn disciplines uit hetzelfde model (Senge). De stam beschrijft duidelijk het "uitdagen van aannames", het kernbegrip van mentale modellen. Kleine kanttekening: het groepsaspect ("maandelijkse sessie") zou studenten naar "Teamleren" kunnen trekken, wat de discriminatie goed maakt maar lichte ambiguïteit introduceert.

---

### Vraag 5 — Rol sterktes in SWOT

**Leerdoel:** Strategisch management | **Bloom:** Begrijpen

**Stam:** Een startup in duurzame mode heeft via een interne analyse ontdekt dat het bedrijf beschikt over een sterk netwerk van lokale leveranciers en een ervaren ontwerpteam. Hoe zou de startup deze elementen in de SWOT-analyse moeten inzetten?

| Optie | Antwoord |
|-------|----------|
| A | Door deze factoren te analyseren als externe kansen in de marktomgeving |
| B | Door deze factoren te gebruiken om bedreigingen vanuit de sector te neutraliseren |
| C | Door deze factoren te gebruiken om concurrentievoordeel te creëren en kansen te grijpen ✓ |
| D | Door deze factoren in te zetten om zwakke punten van de organisatie te compenseren |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 3 |

**Toelichting:** Problematische afleiders. Optie B (sterktes gebruiken om bedreigingen te neutraliseren) is een valide SWOT-strategie (ST-strategie). Optie D (sterktes inzetten om zwaktes te compenseren) is eveneens verdedigbaar. Het correcte antwoord (SO-strategie) is slechts één van de mogelijkheden — de vraag suggereert dat dit de enige juiste inzet is, wat discutabel is (§2.3: meerdere juiste antwoorden).

---

### Vraag 6 — Nut 6-waarden model

**Leerdoel:** Meervoudige waardecreatie | **Bloom:** Begrijpen

**Stam:** Een startup in duurzame mode wil haar strategie bepalen. De oprichter overweegt om het 6-waarden model te gebruiken bij het maken van strategische keuzes. Wat is het belangrijkste voordeel van deze aanpak?

| Optie | Antwoord |
|-------|----------|
| A | Het voorkomt tunnelvisie en stimuleert meervoudige waardecreatie ✓ |
| B | Het garandeert financieel succes en verhoogt de winstgevendheid |
| C | Het vervangt traditionele financiële analyses en marktonderzoek |
| D | Het vereenvoudigt complexe beslissingen tot zes heldere criteria |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 3 |

**Toelichting:** Afleiders B en C bevatten absolute termen ("garandeert", "vervangt") die zonder vakkennis al als onwaarschijnlijk herkenbaar zijn (§2.3: afleiders niet elimineerbaar zonder vakkennis). Afleider D is de enige plausibele afleider. Dit verlaagt het discriminerend vermogen en verhoogt de effectieve gokkans.

---

### Vraag 7 — Definitie meervoudige waardecreatie

**Leerdoel:** Meervoudige waardecreatie | **Bloom:** Begrijpen

**Stam:** Een kledingmerk lanceert een nieuwe collectie gemaakt van gerecycled plastic uit de oceaan. Hierdoor vermindert de vervuiling, krijgen klanten duurzame producten, verbetert het merkimago en ontstaan er banen in de recyclingindustrie. Welk principe illustreert dit voorbeeld?

| Optie | Antwoord |
|-------|----------|
| A | Duurzame innovatie, omdat het bedrijf een nieuwe productiemethode introduceert die milieuvriendelijker is dan traditionele productie |
| B | Meervoudige waardecreatie, omdat één initiatief tegelijkertijd voordelen oplevert voor verschillende belanghebbenden ✓ |
| C | Stakeholdermanagement, omdat het merk rekening houdt met de belangen van klanten, medewerkers en de maatschappij bij strategische beslissingen |
| D | Circulaire economie, omdat het bedrijf afvalmateriaal hergebruikt en zo de levenscyclus van grondstoffen verlengt |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 4 |

**Toelichting:** Afleiders A, C en D zijn allemaal deels van toepassing op het scenario. Circulaire economie (D) is feitelijk correct voor het hergebruik van plastic. Stakeholdermanagement (C) is verdedigbaar gezien de focus op meerdere belanghebbenden. Dit levert ambiguïteit op (§2.3). Het onderscheid draait op de nuance dat MWC het bredere overkoepelende principe is, maar dat vereist diepgaande kennis.

---

### Vraag 8 — Sociale en relationele waarden

**Leerdoel:** Strategisch management | **Bloom:** Toepassen

**Stam:** Een supermarktketen wil haar waardepropositie verbreden en overweegt verschillende initiatieven. Welk initiatief past het beste bij het creëren van sociale en relationele waarden?

| Optie | Antwoord |
|-------|----------|
| A | Het introduceren van een klantenkaart met kortingen en spaarpunten |
| B | Het uitbreiden van het assortiment met biologische en fairtrade producten |
| C | Het doneren van overschotten aan lokale opvangcentra voor daklozen ✓ |
| D | Het organiseren van kookworkshops voor klanten in de winkel |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede vraag met concrete antwoordopties (§2.4: concreetheid). Afleiders vertegenwoordigen andere waardetypes. Kleine kanttekening: afleider D (kookworkshops) heeft ook een relationeel aspect, maar het doneren aan opvangcentra is duidelijker sociaal-relationeel. Alle opties zijn homogeen en concreet.

---

### Vraag 9 — SO-strategie / Groeistrategie

**Leerdoel:** Strategisch management | **Bloom:** Onthouden

**Stam:** Een startup in duurzame verpakkingen heeft een sterk ontwikkelteam en beschikt over een gepatenteerde technologie. Tegelijkertijd groeit de vraag naar milieuvriendelijke alternatieven en zijn er subsidies beschikbaar voor groene innovatie. Welke strategie past het beste bij deze situatie?

| Optie | Antwoord |
|-------|----------|
| A | Defensieve strategie |
| B | Stabiliteitsstrategie |
| C | Groeistrategie ✓ |
| D | Herstructureringsstrategie |

| Dimensie | Score |
|----------|-------|
| Validiteit | 3 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 3 |

**Toelichting:** Het Bloom-niveau is gelabeld als "Onthouden", maar de vraag presenteert een scenario dat de student moet analyseren (sterktes + kansen → SO-strategie). Dit is eerder Toepassen (§2.2: cognitief niveau mismatch). Daarnaast is "groeistrategie" als antwoord vrij intuïtief bij een scenario met kansen en sterktes — het correct antwoord is te voor de hand liggend (§2.3). De afleiders zijn te kort en abstract vergeleken met het scenario.

---

### Vraag 10 — Kernprincipe circulaire economie

**Leerdoel:** Meervoudige waardecreatie | **Bloom:** Begrijpen

**Stam:** Een meubelproducent wil overstappen naar een circulair bedrijfsmodel. Wat is het kernprincipe waar dit model op gebaseerd is?

| Optie | Antwoord |
|-------|----------|
| A | Het verlengen van de levensduur van grondstoffen en producten ✓ |
| B | Het minimaliseren van de productiekosten en arbeidsuren |
| C | Het maximaliseren van de omzet door snellere productvervanging |
| D | Het reduceren van CO2-uitstoot in de productieketen |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Heldere stam met goede afleiders. Afleider D (CO2-reductie) is de sterkste afleider omdat het plausibel maar niet het kernprincipe is. Afleiders B en C zijn iets minder plausibel in de context van circulaire economie. Het correcte antwoord is feitelijk juist en ondubbelzinnig.

---

### Vraag 11 — Maslow toepassen

**Leerdoel:** Bedrijfskundige stromingen | **Bloom:** Toepassen

**Stam:** Een productiemedewerker bij een meubelmakerij heeft een vast contract en verdient net genoeg om zijn vaste lasten te betalen. Zijn manager merkt dat hij weinig contact heeft met collega's en vaak alleen werkt. Welke maatregel sluit volgens Maslow het beste aan bij de behoeften van deze medewerker?

| Optie | Antwoord |
|-------|----------|
| A | Het aanbieden van een salarisverhoging en secundaire arbeidsvoorwaarden |
| B | Het organiseren van gezamenlijke lunchpauzes en werkoverleggen ✓ |
| C | Het geven van meer autonomie en verantwoordelijkheid in zijn werkzaamheden |
| D | Het verstrekken van een vaste werkplek en veilige werkomstandigheden |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 5 |
| Technische kwaliteit | 5 |

**Toelichting:** Uitstekende vraag. De stam geeft voldoende informatie om het Maslow-niveau af te leiden zonder het antwoord weg te geven. Elke afleider vertegenwoordigt een ander niveau van de piramide (fysiologisch, zelfontplooiing, veiligheid). Hoog discriminerend: de student moet de hiërarchie begrijpen én het scenario correct interpreteren.

---

### Vraag 12 — Gedifferentieerde marketingstrategie

**Leerdoel:** Marketing | **Bloom:** Begrijpen

**Stam:** Wat is het belangrijkste kenmerk van een gedifferentieerde marketingstrategie?

| Optie | Antwoord |
|-------|----------|
| A | Het bedrijf richt zich op één specifiek segment met een sterk gespecialiseerd aanbod. |
| B | Het bedrijf richt zich op de gehele markt met één uniform aanbod voor iedereen. |
| C | Het bedrijf richt zich op meerdere segmenten met voor elk segment een aangepast aanbod. ✓ |
| D | Het bedrijf richt zich op meerdere segmenten met hetzelfde standaardaanbod voor elk segment. |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 5 |

**Toelichting:** Technisch zeer goede vraag: alle opties zijn homogeen in structuur en lengte. Afleider D is een slimme variatie die studenten dwingt op het woord "aangepast" vs. "standaard" te letten. De vraag is puur definitievraag (geen scenario) wat prima past bij Begrijpen-niveau maar geen Toepassen toetst.

---

### Vraag 13 — Human Relations kerngedachte

**Leerdoel:** Bedrijfskundige stromingen | **Bloom:** Begrijpen

**Stam:** Wat is een kerngedachte van de Human Relations-stroming?

| Optie | Antwoord |
|-------|----------|
| A | Wetenschappelijke analyse van werktaken leidt tot maximale efficiëntie en productiviteit. |
| B | Rationele besluitvorming en formele organisatiestructuren bepalen de bedrijfsprestaties. |
| C | Sociale relaties en werknemerstevredenheid dragen bij aan betere prestaties. ✓ |
| D | Financiële prikkels en materiële beloningen zijn de belangrijkste motivatoren voor werknemers. |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 5 |

**Toelichting:** Goede definitievraag. Afleiders verwijzen naar Scientific Management (A, D) en bureaucratie (B), wat plausibel is voor studenten die de stromingen verwarren. Alle opties zijn homogeen. De term "belangrijkste" in D is een lichte absolute term maar niet storend.

---

### Vraag 14 — Economische sectoren

**Leerdoel:** Strategisch management | **Bloom:** Onthouden

**Stam:** Een accountantskantoor dat belastingadvies en boekhoudkundige diensten levert aan bedrijven, opereert in welke economische sector?

| Optie | Antwoord |
|-------|----------|
| A | Tertiaire sector ✓ |
| B | Secundaire sector |
| C | Primaire sector |
| D | Quartaire sector |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 4 |

**Toelichting:** Correcte Onthouden-vraag. Kanttekening: een accountantskantoor zou ook als quartaire sector (kennisdienstverlening) geclassificeerd kunnen worden, afhankelijk van de gebruikte definitie. Dit introduceert lichte ambiguïteit (§2.3). De afleiders primair en secundair zijn vrij makkelijk te elimineren zonder diepgaande vakkennis.

---

### Vraag 15 — Psychografische segmentatie

**Leerdoel:** Marketing | **Bloom:** Toepassen

**Stam:** Een sportschoolketen ontwikkelt een nieuw aanbod voor mensen die waarde hechten aan persoonlijke groei, gezondheid en zelfontplooiing. Welk segmentatiecriterium past de keten hierbij toe?

| Optie | Antwoord |
|-------|----------|
| A | Gedragssegmentatie |
| B | Demografische segmentatie |
| C | Sociaal-economische segmentatie |
| D | Psychografische segmentatie ✓ |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede toepassingsvraag. De stam beschrijft waarden en levensstijl zonder de term "psychografisch" te noemen. Afleiders zijn andere segmentatiecriteria uit hetzelfde domein. Lichte kanttekening: "gezondheid" zou ook onder gedragssegmentatie kunnen vallen (gezondheidsgedrag), maar in deze context is psychografisch het duidelijkst correcte antwoord.

---

### Vraag 16 — Belang economische factoren

**Leerdoel:** Strategisch management | **Bloom:** Begrijpen

**Stam:** Een startup in duurzame mode wil haar strategie ontwikkelen. De CEO vraagt zich af waarom het analyseren van economische ontwikkelingen zoals inflatie, werkloosheid en consumentenvertrouwen essentieel is voor haar strategische planning. Wat is hiervan de belangrijkste reden?

| Optie | Antwoord |
|-------|----------|
| A | Economische ontwikkelingen bepalen de wettelijke kaders waarbinnen de organisatie haar duurzaamheidsdoelstellingen kan realiseren |
| B | Economische ontwikkelingen geven inzicht in de technologische innovaties die relevant zijn voor de productie van duurzame mode |
| C | Economische ontwikkelingen vormen de basis voor het identificeren van maatschappelijke trends en veranderende klantenvoorkeuren |
| D | Economische ontwikkelingen beïnvloeden de bestedingsbereidheid van klanten, kostenniveaus en expansiemogelijkheden ✓ |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede vraag. Afleiders verwarren economische factoren met juridische (A), technologische (B) en sociaal-culturele (C) factoren — plausibel voor studenten die PESTEL-categorieën niet goed onderscheiden. De stam is aan de lange kant maar nog leesbaar. Alle opties zijn homogeen.

---

### Vraag 17 — Adam Smith's eigenbelang-principe

**Leerdoel:** Strategisch management | **Bloom:** Begrijpen

**Stam:** Een kledingwinkel verlaagt de prijzen van winterjassen aan het einde van het seizoen om de voorraad op te ruimen. Welk economisch principe van Adam Smith verklaart waarom deze prijsverlaging zowel de winkel als de klanten voordeel oplevert?

| Optie | Antwoord |
|-------|----------|
| A | Het streven naar eigenbelang dat uiteindelijk tot collectief welzijn leidt ✓ |
| B | De verdeling van arbeid die leidt tot efficiëntere productieprocessen |
| C | Het evenwicht tussen vraag en aanbod dat prijzen automatisch reguleert |
| D | De onzichtbare hand die marktfalen voorkomt en stabiliteit waarborgt |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 3 |

**Toelichting:** Afleider C (vraag en aanbod) is discutabel: het scenario beschrijft feitelijk een vraag-en-aanbod-mechanisme (prijsverlaging bij overschot). Afleider D bevat een feitelijke onjuistheid ("marktfalen voorkomt") die door oplettende studenten herkend kan worden zonder specifieke kennis over Smith. De stam geeft een hint door "zowel de winkel als de klanten" te noemen, wat direct naar "eigenbelang → collectief welzijn" wijst (§2.4: antwoord niet weggeven in stam).

---

### Vraag 18 — SWOT: sterkte classificeren

**Leerdoel:** Marketing | **Bloom:** Toepassen

**Stam:** Een koffieketen beschikt over een sterk merk dat door consumenten wordt geassocieerd met kwaliteit en duurzaamheid. Hierdoor zijn klanten bereid een hogere prijs te betalen dan bij concurrenten. Dit is voor de koffieketen een:

| Optie | Antwoord |
|-------|----------|
| A | Kans |
| B | Kerncompetentie |
| C | Sterkte ✓ |
| D | Concurrentievoordeel |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 2 |
| Technische kwaliteit | 3 |

**Toelichting:** Problematische ambiguïteit. Afleider D ("concurrentievoordeel") is sterk verdedigbaar: een sterk merk dat premium pricing mogelijk maakt ís een concurrentievoordeel. Afleider B ("kerncompetentie") is eveneens verdedigbaar als het merk het resultaat is van unieke competenties. Het onderscheid met "sterkte" is te subtiel en contextafhankelijk (§2.3: meerdere juiste antwoorden). De opties zijn ook niet homogeen in type (SWOT vs. RBV-concepten).

---

### Vraag 19 — Menselijke waarde 6-waardenmodel

**Leerdoel:** Meervoudige waardecreatie | **Bloom:** Toepassen

**Stam:** Een productiebedrijf wil meervoudige waardecreatie realiseren en investeert daarom in een uitgebreid programma voor persoonlijke ontwikkeling en gezondheidsbevordering van werknemers. Welk type waarde uit het 6-waardenmodel wordt hiermee primair gecreëerd?

| Optie | Antwoord |
|-------|----------|
| A | Sociale waarde |
| B | Economische waarde |
| C | Menselijke waarde ✓ |
| D | Organisatiewaarde |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede vraag. Afleiders komen uit hetzelfde model. Kleine kanttekening: de stam noemt expliciet "persoonlijke ontwikkeling en gezondheidsbevordering van werknemers", wat vrij direct naar "menselijke waarde" wijst (§2.4: antwoord niet weggeven in stam). De afleider "sociale waarde" is de sterkste afleider omdat het onderscheid met menselijke waarde subtiel is.

---

### Vraag 20 — Effect consumentenvertrouwen

**Leerdoel:** Omgevingsanalyse | **Bloom:** Begrijpen

**Stam:** Een marktonderzoeker constateert dat huishoudens in toenemende mate pessimistisch zijn over hun financiële toekomst. Wat is hiervan het meest waarschijnlijke gevolg voor de bestedingen?

| Optie | Antwoord |
|-------|----------|
| A | Huishoudens verlagen hun spaargeld en kopen meer primaire goederen |
| B | Huishoudens verhogen hun spaargeld en kopen minder luxegoederen ✓ |
| C | Huishoudens verhogen hun bestedingen om van inflatie te profiteren |
| D | Huishoudens investeren meer in duurzame consumptiegoederen |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 5 |

**Toelichting:** Goede vraag met logisch consistent opgebouwde afleiders. Het correcte antwoord is economisch onderbouwd. Afleiders zijn plausibel: C (anti-cyclisch gedrag) en D (waardegericht consumeren) klinken logisch maar zijn niet het standaardgedrag bij pessimisme. Homogeen in structuur.

---

### Vraag 21 — Ongedifferentieerde marketingstrategie

**Leerdoel:** Strategisch management | **Bloom:** Toepassen

**Stam:** Een supermarktketen biedt in al haar vestigingen hetzelfde assortiment basisproducten aan tegen scherpe prijzen. De keten richt zich op alle consumenten in Nederland, zonder onderscheid te maken tussen leeftijd, inkomen of leefstijl. Welke marketingstrategie hanteert deze supermarktketen?

| Optie | Antwoord |
|-------|----------|
| A | Ongedifferentieerde marketingstrategie ✓ |
| B | Gedifferentieerde marketingstrategie |
| C | Geconcentreerde marketingstrategie |
| D | Kostenleiderschap marketingstrategie |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 4 |

**Toelichting:** De stam geeft het antwoord bijna weg: "zonder onderscheid te maken" → "ongedifferentieerd" is een directe vertaling (§2.4: antwoord niet weggeven in stam). Studenten die het woord "differentiëren" kennen maar de theorie niet, kunnen het antwoord afleiden. Afleider D (kostenleiderschap) mengt een Porter-concept met marketingstrategieën, wat niet homogeen is qua conceptueel domein.

---

### Vraag 22 — Kenmerken recessie

**Leerdoel:** Omgevingsanalyse | **Bloom:** Begrijpen

**Stam:** Een bedrijfskundige constateert dat de economie zich in een recessiefase bevindt. Welke combinatie van kenmerken hoort bij deze situatie?

| Optie | Antwoord |
|-------|----------|
| A | Consumptie neemt toe en het aantal vacatures stijgt |
| B | Investeringen stijgen en de werkloosheid daalt |
| C | Consumptie neemt af en het aantal vacatures daalt ✓ |
| D | Productie neemt toe en de inflatie stijgt |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 5 |

**Toelichting:** Technisch zeer goede vraag. Alle opties zijn homogeen opgebouwd (twee kenmerken per optie). De student moet beide kenmerken correct combineren. Afleiders beschrijven andere conjunctuurfasen (hoogconjunctuur, herstel). Geen absolute termen, geen lengte-bias.

---

### Vraag 23 — Stagflatie definitie

**Leerdoel:** Omgevingsanalyse | **Bloom:** Begrijpen

**Stam:** Een econoom constateert dat de economie van een land zich in een periode van stagflatie bevindt. Welke twee economische verschijnselen zijn dan gelijktijdig aanwezig?

| Optie | Antwoord |
|-------|----------|
| A | Stijgende inflatie en toenemende werkloosheid ✓ |
| B | Dalende inflatie en afnemende werkloosheid |
| C | Stijgende inflatie en afnemende werkloosheid |
| D | Dalende inflatie en toenemende werkloosheid |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 5 |

**Toelichting:** Elegant geconstrueerde vraag met systematische variaties. Alle vier opties zijn combinaties van twee variabelen (inflatie ↑/↓ × werkloosheid ↑/↓), wat logische integriteit garandeert. Studenten moeten de betekenis van "stag-" (stagnatie → werkloosheid) en "-flatie" (inflatie) kennen. Technisch excellent.

---

### Vraag 24 — Rationale JIT-leren

**Leerdoel:** Strategisch management | **Bloom:** Begrijpen

**Stam:** Een startup in de technologiesector kiest ervoor om medewerkers continu bij te scholen via korte, gerichte trainingsmodules in plaats van uitgebreide jaarlijkse opleidingsprogramma's. Wat is de belangrijkste reden voor deze aanpak?

| Optie | Antwoord |
|-------|----------|
| A | De organisatie kan zo de opleidingskosten verlagen door minder tijd te investeren in langdurige ontwikkeltrajecten |
| B | De organisatie kan zo beter inspelen op snel veranderende marktomstandigheden en actuele kennisbehoeften ✓ |
| C | De organisatie kan zo de betrokkenheid van medewerkers verhogen door trainingen aantrekkelijker en minder tijdrovend te maken |
| D | De organisatie kan zo beter voldoen aan wettelijke eisen voor continue professionele ontwikkeling in de technologiesector |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede vraag. De afleiders zijn allemaal plausibele redenen maar geen van allen het kernargument. Afleider D is iets zwakker (verzonnen wettelijke eis). De stam is helder en de opties zijn homogeen. Het correcte antwoord is ondubbelzinnig de strategische kernreden.

---

### Vraag 25 — Contingentiebenadering kernprincipe

**Leerdoel:** Bedrijfskundige stromingen | **Bloom:** Begrijpen

**Stam:** Wat is het kernprincipe van de contingentiebenadering in management?

| Optie | Antwoord |
|-------|----------|
| A | De effectiviteit van managementmethoden is universeel toepasbaar in alle organisaties en situaties. |
| B | De effectiviteit van managementmethoden wordt bepaald door de mate van controle en hiërarchie in de organisatie. |
| C | De effectiviteit van managementmethoden hangt af van de specifieke situatie en context. ✓ |
| D | De effectiviteit van managementmethoden is afhankelijk van de menselijke verhoudingen en sociale interacties binnen teams. |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 5 |

**Toelichting:** Technisch uitstekende vraag. Alle opties hebben identieke structuur ("De effectiviteit van managementmethoden..."), wat perfecte homogeniteit geeft. Afleider A is het tegenovergestelde van het correcte antwoord (universeel vs. situationeel), wat een goede discriminator is. Afleiders B en D verwijzen naar andere managementbenaderingen.

---

### Vraag 26 — Contingentiebenadering onderscheidend kenmerk

**Leerdoel:** Bedrijfskundige stromingen | **Bloom:** Analyseren

**Stam:** Welk kenmerk onderscheidt de contingentiebenadering van klassieke managementtheorieën?

| Optie | Antwoord |
|-------|----------|
| A | De overtuiging dat effectieve managementpraktijken situatieafhankelijk zijn ✓ |
| B | De nadruk op wetenschappelijke principes en standaardisatie van werkprocessen |
| C | De focus op menselijke relaties en sociale behoeften van werknemers |
| D | De veronderstelling dat er één beste manier bestaat om te organiseren |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede vraag die analyse vereist (vergelijking met klassieke theorieën). Afleiders verwijzen naar Scientific Management (B), Human Relations (C) en "one best way" (D). Kanttekening: deze vraag overlapt met V25 qua concept. De toevoeging "onderscheidt... van klassieke managementtheorieën" maakt het analyseniveau iets hoger.

---

### Vraag 27 — Duurzaam concurrentievoordeel

**Leerdoel:** Strategisch management | **Bloom:** Begrijpen

**Stam:** Een start-up in de technologiesector wil zich onderscheiden in een snel veranderende markt. Welk strategisch uitgangspunt draagt het meest bij aan duurzaam concurrentievoordeel?

| Optie | Antwoord |
|-------|----------|
| A | Het behalen van schaalvoordelen en het optimaliseren van productieprocessen |
| B | Het aanpassingsvermogen en het structureel vernieuwen van producten ✓ |
| C | Het vestigen van een sterke merkidentiteit en het opbouwen van klantloyaliteit |
| D | Het verlagen van kosten en het verhogen van de operationele efficiëntie |

| Dimensie | Score |
|----------|-------|
| Validiteit | 3 |
| Betrouwbaarheid | 2 |
| Technische kwaliteit | 3 |

**Toelichting:** Het correcte antwoord is discutabel. Optie C (merkidentiteit + klantloyaliteit) is eveneens een breed geaccepteerd uitgangspunt voor duurzaam concurrentievoordeel. De stam stuurt sterk met "snel veranderende markt" naar "aanpassingsvermogen", waardoor het antwoord in de stam verborgen zit (§2.4: antwoord weggeven). Afleiders A en D overlappen conceptueel (beide gaan over kostenefficiëntie). Meerdere verdedigbare antwoorden verlagen de betrouwbaarheid (§2.3).

---

### Vraag 28 — BCG-matrix: cash cow

**Leerdoel:** Strategisch management | **Bloom:** Toepassen

**Stam:** Een fastfoodketen heeft een hamburger die al 15 jaar marktleider is in een verzadigde markt. Het product genereert veel winst, maar de omzetgroei stagneert. Volgens de BCG-matrix is dit product een:

| Optie | Antwoord |
|-------|----------|
| A | Star |
| B | Question mark |
| C | Dog |
| D | Cash cow ✓ |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 5 |
| Technische kwaliteit | 5 |

**Toelichting:** Uitstekende vraag. De stam beschrijft de twee BCG-dimensies (hoog marktaandeel + lage groei) via een concreet scenario. Alle afleiders zijn uit hetzelfde model. Het antwoord is ondubbelzinnig maar vereist kennis van de matrix. Kort, helder, homogeen. De Engelse termen zijn gangbaar in het vakgebied.

---

### Vraag 29 — Impact rente op bedrijven

**Leerdoel:** Omgevingsanalyse | **Bloom:** Toepassen

**Stam:** De rente op leningen is het afgelopen jaar flink gestegen. Wat is hiervan het gevolg voor een meubelzaak die veel verkopen op afbetaling realiseert?

| Optie | Antwoord |
|-------|----------|
| A | Een bedreiging want klanten worden voorzichtiger met uitgaven ✓ |
| B | Een kans want klanten profiteren van hogere spaarrentes |
| C | Een bedreiging want de inkoopkosten van meubels stijgen |
| D | Een kans want afbetaling wordt aantrekkelijker dan contant betalen |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede toepassingsvraag die PESTEL-analyse koppelt aan een concrete bedrijfssituatie. Afleider D bevat een logische contradictie (hogere rente maakt afbetaling juist duurder), wat bij goed nadenken herkenbaar is. Afleider C is een plausibele maar indirecte redenering. Het correcte antwoord is ondubbelzinnig.

---

### Vraag 30 — Differentiatiestrategie Porter

**Leerdoel:** Strategisch management | **Bloom:** Onthouden

**Stam:** Wat is een kernkenmerk van de differentiatiestrategie volgens Porter?

| Optie | Antwoord |
|-------|----------|
| A | De organisatie richt zich op het verlagen van de kostprijs om de laagste prijzen in de markt te kunnen hanteren |
| B | De organisatie richt zich op een specifiek marktsegment met gespecialiseerde producten of diensten |
| C | De organisatie richt zich op het opbouwen van langdurige relaties met leveranciers om efficiency te verhogen |
| D | De organisatie richt zich op het aanbieden van unieke producteigenschappen die door klanten worden gewaardeerd ✓ |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 5 |

**Toelichting:** Goede definitievraag. Afleiders A (kostenleiderschap) en B (focusstrategie) zijn andere Porter-strategieën — perfect in hetzelfde domein. Afleider C is iets minder sterk (leveranciersrelaties is geen Porter-strategie). Alle opties zijn homogeen in lengte en structuur.

---

### Vraag 31 — DESTEP politiek-juridisch

**Leerdoel:** Marketing | **Bloom:** Toepassen

**Stam:** Een webwinkel in cosmetica moet door nieuwe Europese wetgeving alle ingrediënten van haar producten uitgebreider vermelden op de verpakking. Welke externe factor speelt hier een rol?

| Optie | Antwoord |
|-------|----------|
| A | Een politiek-juridische factor ✓ |
| B | Een technologische factor |
| C | Een sociaal-culturele factor |
| D | Een economische factor |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede toepassingsvraag. De stam noemt "Europese wetgeving", wat direct wijst naar politiek-juridisch — het antwoord is daardoor vrij voor de hand liggend (§2.3: correct antwoord niet te vanzelfsprekend). Een sterkere stam zou de wetgeving niet expliciet noemen maar het effect beschrijven. Afleiders zijn homogeen en uit hetzelfde DESTEP-kader.

---

### Vraag 32 — Intellectuele waarden

**Leerdoel:** Strategisch management | **Bloom:** Onthouden

**Stam:** Onder welke waardecategorie vallen de onderzoeksresultaten, technologische knowhow en auteursrechten van een organisatie?

| Optie | Antwoord |
|-------|----------|
| A | Intellectuele waarden ✓ |
| B | Immateriële waarden |
| C | Kenniswaarden |
| D | Intangible assets |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 2 |
| Technische kwaliteit | 2 |

**Toelichting:** Problematische afleiders. "Immateriële waarden" (B) en "Intangible assets" (D) zijn synoniemen/vertalingen van hetzelfde concept. "Kenniswaarden" (C) klinkt als een redelijk synoniem voor intellectuele waarden. De afleiders zijn niet uit hetzelfde model (6-waardenmodel) maar verzonnen categorieën. Dit ondermijnt de homogeniteit en het discriminerend vermogen (§2.4: afleiders uit zelfde conceptueel domein). Gebruik liever andere categorieën uit het 6-waardenmodel (sociale waarde, ecologische waarde, etc.).

---

### Vraag 33 — Inflatie als macro-economisch begrip

**Leerdoel:** Omgevingsanalyse | **Bloom:** Onthouden

**Stam:** Een bedrijfskundige voert een omgevingsanalyse uit en wil de macro-economische factoren in kaart brengen die invloed hebben op de koopkracht van consumenten. Welk begrip hoort bij deze analyse?

| Optie | Antwoord |
|-------|----------|
| A | Inflatie ✓ |
| B | Liquiditeit |
| C | Marktaandeel |
| D | Rentabiliteit |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 3 |

**Toelichting:** Het correcte antwoord is feitelijk juist. Kanttekening: afleiders B (liquiditeit), C (marktaandeel) en D (rentabiliteit) zijn bedrijfseconomische begrippen, geen macro-economische. Studenten kunnen ze al uitsluiten op basis van het macro/micro-onderscheid zonder te weten wat inflatie precies is (§2.3: afleiders niet elimineerbaar zonder vakkennis). Gebruik liever andere macro-economische begrippen als afleiders (bijv. BBP, wisselkoers, handelsbalans).

---

### Vraag 34 — Kenmerken meervoudige waardecreatie

**Leerdoel:** Meervoudige waardecreatie | **Bloom:** Analyseren

**Stam:** Een organisatie wil meervoudige waardecreatie toepassen in haar strategie. Wat kenmerkt deze aanpak?

| Optie | Antwoord |
|-------|----------|
| A | Het gelijktijdig realiseren van economische, sociale en ecologische waarde voor verschillende stakeholders. ✓ |
| B | Het maximaliseren van financiële waarde voor aandeelhouders door efficiënte inzet van middelen en kostenbeheersing. |
| C | Het creëren van waarde voor meerdere afdelingen binnen de organisatie door middel van geïntegreerde processen. |
| D | Het sequentieel realiseren van economische waarde gevolgd door investeringen in sociale en ecologische projecten. |

| Dimensie | Score |
|----------|-------|
| Validiteit | 3 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 4 |

**Toelichting:** Het Bloom-niveau "Analyseren" is discutabel — dit is eerder een definitievraag (Begrijpen). De vraag overlapt sterk met V36 (§2.2: onderwerpdubbeling). Afleider D is een slimme afleider (gelijktijdig vs. sequentieel). Afleiders B en C zijn minder plausibel voor wie het concept enigszins kent.

---

### Vraag 35 — Cirkelorganisatie

**Leerdoel:** Marketing | **Bloom:** Onthouden

**Stam:** Wat is het belangrijkste kenmerk van een cirkelorganisatie?

| Optie | Antwoord |
|-------|----------|
| A | Hiërarchische structuur met circulaire communicatie |
| B | Centrale aansturing met decentrale uitvoering |
| C | Netwerk van zelforganiserende cirkels ✓ |
| D | Horizontale samenwerking tussen functionele afdelingen |

| Dimensie | Score |
|----------|-------|
| Validiteit | 3 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Inhoudelijk goede vraag met homogene afleiders uit het organisatiestructuur-domein. Het Bloom-niveau (Onthouden) past. Validiteitskritiek: het leerdoel is "Marketing" maar de vraag gaat over organisatiestructuur — dit is een contextmismatch (§2.2). Daarnaast is het correcte antwoord het enige dat het woord "cirkels" bevat, wat een taalkundige hint geeft bij een vraag over "cirkelorganisatie" (§2.4: geen hints naar correct antwoord).

---

### Vraag 36 — Meervoudige waardecreatie kenmerken (2)

**Leerdoel:** Meervoudige waardecreatie | **Bloom:** Analyseren

**Stam:** Een productiebedrijf investeert in duurzame grondstoffen, verbetert arbeidsomstandigheden en streeft naar winstgroei. Welk kenmerk van meervoudige waardecreatie illustreert dit voorbeeld?

| Optie | Antwoord |
|-------|----------|
| A | Het sequentieel realiseren van economische doelen gevolgd door maatschappelijke verantwoordelijkheden. |
| B | Het prioriteren van financiële waarde met aanvullende aandacht voor sociale en ecologische aspecten. |
| C | Het gelijktijdig nastreven van financiële, sociale en ecologische waarde voor stakeholders. ✓ |
| D | Het balanceren tussen kortetermijnwinst en langetermijnwaarde voor aandeelhouders en klanten. |

| Dimensie | Score |
|----------|-------|
| Validiteit | 2 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 4 |

**Toelichting:** **⚠ Onderwerpdubbeling met V34.** Beide vragen toetsen hetzelfde concept (kenmerken MWC) op hetzelfde Bloom-niveau met vrijwel identieke correcte antwoorden en afleiders. Eén van beide moet vervangen worden (§2.2: geen onderwerpdubbeling). Afleider B is de sterkste afleider (prioriteren vs. gelijktijdig is subtiel). De stam is concreter dan V34, wat een pluspunt is.

---

### Vraag 37 — Hybride werkmodel

**Leerdoel:** Marketing | **Bloom:** Begrijpen

**Stam:** Een organisatie voert een nieuw werkbeleid in waarbij medewerkers zelf kunnen bepalen of ze vanuit huis of op locatie werken, afhankelijk van hun taken en voorkeuren. Welk type werkmodel past hierbij?

| Optie | Antwoord |
|-------|----------|
| A | Een model waarin werknemers volledig zelfstandig hun werklocatie en werktijden bepalen |
| B | Een model waarin werknemers permanent vanuit huis werken met incidenteel kantoorbezoek |
| C | Een model waarin werknemers per project worden toegewezen aan een vaste werklocatie |
| D | Een model waarin werknemers afwisselend thuis en op kantoor werken ✓ |

| Dimensie | Score |
|----------|-------|
| Validiteit | 3 |
| Betrouwbaarheid | 3 |
| Technische kwaliteit | 3 |

**Toelichting:** Leerdoel-mismatch: gelabeld als Marketing maar betreft HRM/organisatiestructuur (§2.2: contextmismatch). De vraag is vrij intuïtief — "vanuit huis of op locatie" wijst zonder vakkennis naar "afwisselend thuis en op kantoor" (§2.3: correct antwoord te voor de hand liggend). Afleider A is discutabel: de stam noemt "zelf kunnen bepalen", wat ook bij A past. Het onderscheid hangt op "volledig zelfstandig" vs. "afhankelijk van taken".

---

### Vraag 38 — Deeleconomie concept

**Leerdoel:** Strategisch management | **Bloom:** Begrijpen

**Stam:** Een startup lanceert een platform waarop gebruikers elektrische steps kunnen huren per minuut via een app. De steps blijven eigendom van het bedrijf. Welk kenmerk van de deeleconomie illustreert dit businessmodel het best?

| Optie | Antwoord |
|-------|----------|
| A | Consumenten betalen voor tijdelijk gebruik in plaats van voor bezit ✓ |
| B | Particulieren delen hun eigen bezittingen met anderen tegen vergoeding |
| C | Platforms verbinden vraag en aanbod zonder zelf eigenaar te zijn |
| D | Gebruikers betalen een abonnement voor onbeperkt toegang tot producten |

| Dimensie | Score |
|----------|-------|
| Validiteit | 4 |
| Betrouwbaarheid | 4 |
| Technische kwaliteit | 4 |

**Toelichting:** Goede vraag. De stam vermeldt dat de steps eigendom van het bedrijf zijn, wat B en C uitsluit voor wie goed leest. Afleider D (abonnementsmodel) is een plausibele maar andere vorm van toegangseconomie. Het correcte antwoord is ondubbelzinnig. Kanttekening: strikt genomen is een bedrijf dat eigen assets verhuurt geen "deeleconomie" in de klassieke definitie (peer-to-peer), wat lichte ambiguïteit introduceert.

---

### Vraag 39 — Oligopolie: strategische interdependentie

**Leerdoel:** Strategisch management | **Bloom:** Begrijpen

**Stam:** Waarom is het voor een energieleverancier in een oligopolistische markt riskant om als enige de tarieven te verlagen?

| Optie | Antwoord |
|-------|----------|
| A | Omdat de overheid dan kan ingrijpen met prijsregulering |
| B | Omdat klanten wantrouwig worden bij plotselinge prijsverlagingen |
| C | Omdat het marktaandeel dan te snel groeit voor de productiecapaciteit |
| D | Omdat andere aanbieders waarschijnlijk hun prijzen ook verlagen ✓ |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 5 |
| Technische kwaliteit | 5 |

**Toelichting:** Uitstekende vraag. De stam is helder en beknopt. Het correcte antwoord test begrip van wederzijdse afhankelijkheid in oligopolies. Alle afleiders klinken als redelijke bedrijfsrisico's maar missen de kern van oligopolistisch gedrag. Geen absolute termen, goede homogeniteit, hoog discriminerend vermogen.

---

### Vraag 40 — PESTEL vs. Porter

**Leerdoel:** Omgevingsanalyse | **Bloom:** Begrijpen

**Stam:** Wat is het belangrijkste verschil tussen een PESTEL-analyse en de vijfkrachtenanalyse van Porter?

| Optie | Antwoord |
|-------|----------|
| A | PESTEL analyseert externe kansen en bedreigingen, Porter interne sterktes en zwaktes |
| B | PESTEL richt zich op macro-omgevingsfactoren, Porter op concurrentiekrachten in de sector ✓ |
| C | PESTEL is kwalitatief van aard, Porter gebruikt kwantitatieve marktgegevens |
| D | PESTEL beschrijft de huidige situatie, Porter voorspelt toekomstige ontwikkelingen |

| Dimensie | Score |
|----------|-------|
| Validiteit | 5 |
| Betrouwbaarheid | 5 |
| Technische kwaliteit | 5 |

**Toelichting:** Uitstekende vraag. De student moet het onderscheid tussen macro- en meso-analyse begrijpen. Afleider A is de sterkste afleider (verwarring extern/intern). Alle opties zijn homogeen in structuur (PESTEL doet X, Porter doet Y). Geen absolute termen, geen hints in de stam. Hoog discriminerend.

---

## 4. Conclusie

### Sterke punten

1. **Homogeniteit:** De meeste vragen hebben goed homogene antwoordopties qua lengte en stijl.
2. **Conceptueel domein:** Afleiders komen overwegend uit hetzelfde model/theorie als het correcte antwoord.
3. **Geen stellingvragen:** Alle vragen zijn reguliere MC-vragen met directe vraagstelling.
4. **Leerdoelverdeling:** De verdeling over de vijf leerdoelen klopt exact met de voorgeschreven weging.

### Verbeterpunten

1. **Onderwerpdubbeling V34/V36:** Beide vragen toetsen hetzelfde concept op hetzelfde niveau. Vervang één van beide.
2. **Ambigue afleiders (V5, V7, V18, V27):** Meerdere vragen hebben afleiders die gedeeltelijk correct of verdedigbaar zijn. Dit verlaagt de betrouwbaarheid.
3. **Antwoord weggegeven in stam (V17, V19, V21, V27, V31):** De stam bevat sleutelbegrippen die direct naar het antwoord leiden.
4. **Elimineerbare afleiders (V6, V32, V33):** Afleiders die op basis van logica of absolute termen al uitgesloten kunnen worden zonder vakkennis.
5. **Leerdoel-mismatch (V35, V37):** Twee Marketing-vragen gaan over organisatiestructuur/HRM.
6. **Bloom-niveau onevenwicht:** 18/40 vragen op Begrijpen-niveau. Overweeg meer Toepassen- en Analyseren-vragen.
7. **Scenarioheraling:** Meerdere vragen gebruiken "startup in duurzame mode" — meer variatie wenselijk.
8. **Correct antwoord te vanzelfsprekend (V9, V21, V31, V37):** Bij meerdere vragen is het correcte antwoord te intuïtief herkenbaar.

### Aanbevelingen

| Prioriteit | Actie | Vragen |
|------------|-------|--------|
| **Hoog** | Vervang één van de dubbele vragen | V34 of V36 |
| **Hoog** | Herschrijf ambigue afleiders | V5, V7, V18, V27 |
| **Gemiddeld** | Herformuleer stam om antwoord niet weg te geven | V17, V19, V21, V27, V31 |
| **Gemiddeld** | Vervang elimineerbare afleiders | V6, V32, V33 |
| **Laag** | Corrigeer leerdoel-labels | V35, V37 |
| **Laag** | Varieer scenario-contexten | V5, V6, V9, V16 |
