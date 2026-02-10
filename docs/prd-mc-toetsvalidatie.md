# PRD — MC Toetsvalidatie & Generatie Platform

**Versie:** 1.1  
**Datum:** Februari 2026  
**Scope:** Intern gebruik — één instelling  

---

## 01 · Context & Probleemstelling

Docenten in het hoger onderwijs besteden veel tijd aan het maken van MC-toetsvragen, maar hebben beperkte middelen om de kwaliteit systematisch te borgen. Bestaande processen zijn handmatig, inconsistent en tijdrovend.

### Kernproblemen

**① Kwaliteitsborging is ad hoc**  
Toetsvragen worden nauwelijks systematisch beoordeeld op technische kwaliteit, betrouwbaarheid en validiteit. Fouten worden pas na afname zichtbaar in itemanalyses — te laat om te corrigeren.

**② Vraagproductie is een bottleneck**  
Het schrijven van goede MC-vragen is een gespecialiseerde vaardigheid. Docenten hebben vaak te weinig tijd of training om voldoende kwalitatieve vragen te produceren, zeker op hogere Bloom-niveaus.

**③ Geen geïntegreerd instrumentarium**  
Toetscommissies beoordelen met losse checklists en spreadsheets. Er is geen centraal systeem dat validatie, feedback en verbetersuggesties combineert met generatiemogelijkheden.

### Indicatieve cijfers

| Metric | Waarde | Bron |
|--------|--------|------|
| MC-vragen met technische fouten | ~40% | Tarrant et al., 2006 |
| Tijd per 20 vragen (handmatig) | 3-5 uur | — |
| Vragen op laagste Bloom-niveau | ~80% | Schatting op basis van HO-toetsanalyses |

---

## 02 · Productvisie

Een intern webplatform dat docenten in staat stelt MC-toetsvragen te laten beoordelen door AI op drie kwaliteitsdimensies, én op basis van studiemateriaal nieuwe vragen te laten genereren — met de docent altijd in de regie.

> **Kernprincipe: Human-in-the-loop.** AI assisteert en adviseert; de docent besluit. Elke AI-output is een voorstel dat beoordeeld, aangepast en goedgekeurd moet worden door de vakinhoudelijk expert.

### Twee kernfuncties

| | Module A — Validatie | Module B — Generatie |
|---|---|---|
| **Input** | Bestaande MC-vragenset (upload of handmatige invoer) | Studiemateriaal (PDF, tekst) + toetsmatrijs of leerdoelen |
| **Proces** | AI beoordeelt op betrouwbaarheid, technische kwaliteit en validiteit | AI genereert MC-vragen op gewenst Bloom-niveau |
| **Output** | Gedetailleerd rapport met scores, probleemanalyses en verbetervoorstellen | Vragenset met metadata, inclusief automatische kwaliteitscheck |

---

## 03 · Gebruikers & Persona's

Het systeem bedient vier primaire gebruikersrollen binnen één instelling.

### 👩‍🏫 Docent / Toetsmaker
Schrijft en beheert toetsvragen. Wil snel feedback op kwaliteit en hulp bij het maken van vragen op hogere Bloom-niveaus. Heeft beperkt tijd en soms beperkte toetsdidactische training.

### 🔍 Toetscommissielid / Reviewer
Beoordeelt toetskwaliteit op opleidingsniveau. Wil een gestructureerd overzicht van kwaliteitsissues en trends, en een audittrail van verbeteringen per toets.

### ⚙️ Toetsdeskundige / Onderwijskundige
Adviseert over toetsbeleid en -kwaliteit. Configureert beoordelingscriteria, beheert instellingsbrede standaarden en analyseert kwaliteitstrends over opleidingen heen.

### 🛠️ Beheerder (Technisch)
Beheert gebruikersaccounts, LLM-configuratie, en systeeminstellingen. Monitort API-gebruik en kosten.

---

## 04 · Scope & Feature Matrix

### Module A — Validatie

| Feature | Prioriteit | Beschrijving |
|---------|-----------|--------------|
| **Upload vragenset** | Must | Upload MC-vragen via CSV/Excel/DOCX of handmatige invoer. Parsing van stam, opties en correct antwoord. |
| **Deterministische analyse** | Must | Automatische detectie van langste-antwoord-bias, homogeniteit, absolute termen, ontkenningen. Output in `tech_kwant_*` kolommen. |
| **AI-beoordeling (3 dimensies)** | Must | LLM beoordeelt elke vraag op betrouwbaarheid, technische kwaliteit (kwalitatief) en validiteit. Scores 1-5 + toelichting. |
| **Verbetervoorstellen** | Must | Per vraag concrete suggesties voor verbetering: herformulering stam, betere afleiders, hoger Bloom-niveau. |
| **Dashboard per toets** | Must | Overzichtspagina met scores, kleurindicatoren, filtermogelijkheden en sortering op urgentie. |
| **Export rapport** | Must | Export naar CSV, PDF en Markdown met alle scores, analyses en suggesties. |
| **Toetsmatrijs-koppeling** | Should | Koppel vragen aan leerdoelen/toetsmatrijs om dekking en Bloom-verdeling te visualiseren. |
| **Versiegeschiedenis** | Should | Bijhouden van wijzigingen per vraag met diff-view en audittrail voor toetscommissie. |
| **Batch-revalidatie** | Could | Na handmatige aanpassingen: hele set opnieuw laten beoordelen met vergelijking voor/na. |

### Module B — Generatie

| Feature | Prioriteit | Beschrijving |
|---------|-----------|--------------|
| **Materiaal upload** | Must | Upload studiemateriaal (PDF, DOCX, platte tekst). Chunking en indexering voor retrieval. |
| **Vraagspecificatie** | Must | Docent specificeert: aantal vragen, gewenst Bloom-niveau, onderwerp/leerdoel, aantal opties. |
| **RAG-generatie** | Must | Genereer MC-vragen op basis van retrieved chunks uit studiemateriaal. Geen hallucinatie door grounding. |
| **Inline kwaliteitscheck** | Must | Gegenereerde vragen doorlopen automatisch dezelfde validatiepipeline als Module A. |
| **Iteratief verfijnen** | Should | Docent kan per vraag feedback geven ("moeilijker", "ander onderwerp") en AI past aan. |
| **Toetsmatrijs-gestuurd genereren** | Should | Genereer vragen gebalanceerd over alle cellen van een toetsmatrijs (leerdoel × Bloom-niveau). |
| **Voorbeeldvragen als stijlreferentie** | Could | Docent levert voorbeeldvragen aan als stijl- en niveaureferentie (few-shot prompting). |

---

## 05 · Gebruikersflows & UX

### Flow A — Validatie

```
A1 Upload        →  A2 Parsing       →  A3 Analyse        →  A4 Dashboard     →  A5 Verbeter      →  A6 Export
CSV/Excel/DOCX      Herkenning stam,    Deterministisch      Scores, kleur-      Suggesties          Rapport in
of handmatige       opties, correct     + AI-beoordeling     codes, detail-      bekijken,           CSV, PDF of
invoer              antwoord. Preview   (3 dimensies)        views per vraag     accepteren of       Markdown
                    & correctie                                                  aanpassen
```

### Flow B — Generatie

```
B1 Materiaal     →  B2 Specificeer   →  B3 Genereer       →  B4 Valideer      →  B5 Review        →  B6 Export
Upload studie-      Aantal, Bloom-      RAG-gestuurde         Automatische        Docent beoor-       Goedgekeurde
materiaal +         niveau, onder-      vraaggerneratie       kwaliteitscheck     deelt, past aan,    vragen
toetsmatrijs        werp, # opties      met LLM               (Module A)         keurt goed          exporteren
```

### UX-principes

> **Transparantie boven magie.** Toon altijd waaróm de AI een score geeft. Elke beoordeling bevat een korte toelichting. Bij generatie is de bron (chunk) altijd traceerbaar.

- **Progressive disclosure:** Overzicht eerst (dashboard), detail on-demand (per vraag)
- **Inline editing:** Vragen direct aanpassen vanuit het validatierapport, zonder context te verliezen
- **Batch + individueel:** Zowel hele sets als individuele vragen verwerken
- **Non-blocking processing:** Lange analyses draaien asynchroon op de sidecar (Cloud Run). De `exams`-tabel is opgenomen in de Supabase Realtime-publicatie, zodat statuswijzigingen (`processing` → `completed`) automatisch naar de frontend worden gepusht. Tijdens de analyse toont het dashboard een **voortgangsbalk** ("Vraag 5 van 20 geanalyseerd") die real-time bijwerkt via de `question_count` en `questions_analyzed` kolommen op de `exams`-tabel. De sidecar incrementeert `questions_analyzed` atomisch na elke geanalyseerde vraag via een SQL-functie (`increment_questions_analyzed`). Zodra de status `completed` bereikt, worden de scores, heatmap en KPI-kaarten automatisch geladen zonder handmatige paginaverversing
- **Kleurcodes:** 🟢 Score 4-5 · 🟡 Score 3 · 🔴 Score 1-2 — direct zichtbaar in het overzicht

---

## 06 · Beoordelingsframework

Elke MC-vraag wordt beoordeeld op drie dimensies. De deterministische analyse levert kwantitatieve data; het LLM voegt kwalitatieve beoordeling toe.

### Betrouwbaarheid (Reliability)

*Zou de student bij herhaling dezelfde score behalen?*

| Criterium | Output-veld | Type |
|-----------|------------|------|
| Discriminerend vermogen | `bet_discriminatie` | AI (kwalitatief) |
| Ambiguïteit | `bet_ambiguiteit` | AI (kwalitatief) |
| Gokkans-reductie | Meegewogen in score | AI (kwalitatief) |
| Totaalscore | `bet_score` (1-5) | AI |
| Motivatie | `bet_toelichting` | AI (max 50 woorden) |

### Technische Kwaliteit

*Is de vraag goed geconstrueerd? Twee lagen: deterministisch + AI.*

| Criterium | Output-veld | Type |
|-----------|------------|------|
| Langste-antwoord-bias | `tech_kwant_longest_bias` | Deterministisch |
| Homogeniteit opties | `tech_kwant_homogeneity_score` | Deterministisch |
| Absolute termen | `tech_kwant_absolute_terms_*` | Deterministisch |
| Ontkenning in stam | `tech_kwant_negation_*` | Deterministisch |
| Plausibiliteit afleiders | `tech_kwal_afleiders_score` | AI (kwalitatief) |
| Helderheid stam | `tech_kwal_stam_score` | AI (kwalitatief) |
| Grammaticale hints | Meegewogen | AI (kwalitatief) |
| Totaalscore | `tech_kwal_score` (1-5) | AI (gewogen) |

### Validiteit (Validity)

*Meet de vraag wat je beoogt te meten?*

| Criterium | Output-veld | Type |
|-----------|------------|------|
| Cognitief niveau (Bloom) | `val_cognitief_niveau` | AI (classificatie) |
| Aansluiting leerdoel | Meegewogen in score | AI (kwalitatief) |
| Totaalscore | `val_score` (1-5) | AI |
| Motivatie | `val_toelichting` | AI (max 50 woorden) |

### Visualisatie per vraag

Elke vraag krijgt een detailkaart met de drie dimensies naast elkaar — geen samengestelde score, zodat de docent zélf kan wegen wat belangrijk is.

| Element | Weergave | Beschrijving |
|---------|----------|--------------|
| **Score-indicators** | 3 afzonderlijke badges (🟢🟡🔴) | Per dimensie (B / T / V) een kleurcode met score 1-5, direct zichtbaar naast elkaar |
| **Radarchart** | Driehoekig radardiagram | Visueel profiel per vraag: betrouwbaarheid, technische kwaliteit, validiteit als drie assen. Maakt sterke en zwakke dimensies in één oogopslag zichtbaar |
| **Deelscores technisch** | Horizontale bar | Stam-score en afleiders-score apart weergegeven, plus deterministische flags als tags |
| **Bloom-badge** | Gekleurd label | Cognitief niveau als badge: Onthouden (grijs) → Begrijpen (blauw) → Toepassen (teal) → Analyseren (goud) |
| **Toelichting-panels** | 3 uitklapbare secties | Per dimensie de `*_toelichting` met max 50 woorden motivatie |
| **Verbetervoorstellen** | Actielijst | Concrete suggesties, gekoppeld aan de dimensie waar ze bij horen |

### Geaggregeerde visualisaties (toetsniveau)

Op het dashboard-overzicht verschijnen geaggregeerde views over alle vragen in de toets.

| Visualisatie | Type | Beschrijving |
|-------------|------|--------------|
| **Scoreverdeling per dimensie** | 3× histogram of stacked bar | Verdeling van scores 1-5 per dimensie. Toont in één oogopslag hoeveel vragen goed/matig/slecht scoren op B, T en V afzonderlijk |
| **Heatmap vraag × dimensie** | Matrixtabel met kleurgradiënt | Elke rij = vraag, drie kolommen = B / T / V. Kleur van groen (5) naar rood (1). Scrollbaar, sorteerbaar per kolom |
| **Bloom-verdeling** | Donut- of staafdiagram | Hoeveel vragen per cognitief niveau. Optioneel naast een toetsmatrijs-streefverdeling (indien aanwezig) |
| **Probleemfrequentie** | Horizontale bar chart | Top-N meest voorkomende problemen (`tech_problemen`, flags). Toont patronen: "12 vragen hebben langste-antwoord-bias" |
| **Dimensie-gemiddelden** | 3 KPI-kaarten | Gemiddelde score per dimensie als groot getal met trend-indicator en kleurcode |
| **Aandachtsvragen** | Gefilterde tabel | Vragen waar minstens één dimensie ≤ 2 scoort, gesorteerd op urgentie. Directe link naar detail-kaart |

> **Geen samengestelde score — bewust.** Eén geaggregeerd cijfer maskeert waar het probleem zit. Een vraag met V=5, T=1, B=4 heeft een heel ander verbetertraject dan V=2, T=4, B=3. Door de drie dimensies apart te houden, ziet de docent direct wáár actie nodig is.

---

## 07 · Technische Architectuur

Supabase als unified backend platform, aangevuld met een Python sidecar voor AI-processing. Minimale operationele complexiteit door alles onder één dak te houden.

### Systeemarchitectuur

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│           SPA — React / Vite                         │
│     Dashboard, vraag-editor, upload, export          │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
   ┌──────┴──────┐          ┌──────┴──────┐
   │ API Gateway │          │  Realtime   │
   │ REST / tRPC │          │  Supabase   │
   └──────┬──────┘          └─────────────┘
          │
   ┌──────┴──────────────────────────────────┐
   │            PROCESSING LAYER              │
   │                                          │
   │  ┌──────────────┐  ┌──────────────────┐ │
   │  │Deterministisch│  │  LLM Orchestrator│ │
   │  │  Analyse      │  │ Validatie +      │ │
   │  │  Engine       │  │ Generatie prompts│ │
   │  └──────────────┘  └──────────────────┘ │
   │                                          │
   │  ┌──────────────────────────────────┐   │
   │  │     RAG Pipeline                  │   │
   │  │  Chunking → Embedding → Search    │   │
   │  └──────────────────────────────────┘   │
   └──────┬──────────────────────────────────┘
          │
   ┌──────┴──────────────────────────────────┐
   │             SUPABASE PLATFORM            │
   │                                          │
   │  ┌──────────┐ ┌──────────┐ ┌──────────┐│
   │  │ Postgres │ │ pgvector │ │ Storage  ││
   │  │Vragen,   │ │Embeddings│ │Uploads,  ││
   │  │scores,   │ │studie-   │ │exports,  ││
   │  │versies   │ │materiaal │ │PDFs      ││
   │  └──────────┘ └──────────┘ └──────────┘│
   │                                         │
   │  ┌──────────┐ ┌────────────────────┐   │
   │  │   Auth   │ │  Edge Functions    │   │
   │  │SSO/SAML  │ │  Async processing  │   │
   │  └──────────┘ └────────────────────┘   │
   └─────────────────────────────────────────┘
```

### Technologiekeuzes

| Component | Technologie | Rationale |
|-----------|-------------|-----------|
| Frontend | Vite + React + TypeScript | Statische SPA gehost via GitHub Pages, snelle dev-server en build, Supabase-integratie via `@supabase/supabase-js` |
| Backend API | Supabase Edge Functions + Python sidecar (FastAPI) | Edge Functions voor CRUD en auth-logica; Python sidecar voor NLP/AI-pipeline |
| Database | Supabase Postgres | Managed PostgreSQL met Row Level Security, realtime subscriptions en ingebouwde REST/GraphQL API |
| Vector Store | Supabase pgvector | Geïntegreerd in dezelfde Postgres-instantie; geen aparte vectordatabase nodig |
| Object Storage | Supabase Storage | S3-compatibel, RLS-policies op buckets, directe integratie met auth |
| Auth | Supabase Auth (SAML/OIDC) | SSO-koppeling met institutionele IdP, ingebouwde user management, RLS-integratie |
| Queue / Async | Supabase Edge Functions + pg_cron / pg_net | Database-triggers starten async processing; pg_net voor HTTP-calls naar AI-pipeline |
| LLM Provider | Anthropic Claude API (primair) | Sterke instructie-opvolging, structured output, Nederlands |
| Embedding | multilingual-e5-base (in-container, 768 dim) | Open-source, geen externe API, goed in Nederlands |
| Hosting | Supabase Cloud (EU-regio) of Self-hosted | EU-dataresidentie, optie voor self-hosted Supabase op eigen infra voor maximale data-soevereiniteit |

---

## 08 · Datamodel & API

Supabase als unified platform: Postgres voor relationele data, pgvector voor embeddings, Storage voor bestanden, Auth voor SSO. Alles onder één dak.

### Entiteiten

```sql
-- Supabase Postgres schema (vereenvoudigd)
-- RLS policies en indexes weggelaten voor leesbaarheid

exams {
  id: uuid                          -- default gen_random_uuid()
  title: text
  course: text
  created_by: uuid                  -- references auth.users(id)
  learning_goals: text[]
  analysis_status: analysis_status  -- pending|processing|completed|failed
  question_count: int               -- totaal vragen (voortgangsbalk)
  questions_analyzed: int           -- geanalyseerd (voortgangsbalk)
}

questions {
  id: uuid
  exam_id: uuid                     -- references exams(id)
  position: int                     -- volgorde binnen toets
  stem: text
  options: jsonb                    -- [{text, position, is_correct}]
  correct_option: int
  bloom_level: text                 -- check constraint
  learning_goal: text
  category: text                    -- onderwerpscategorie
  version: int
  source: text                      -- manual|generated|imported
}

assessments {
  id: uuid
  question_id: uuid                 -- references questions(id)
  question_version: int             -- unique constraint met question_id

  -- Deterministisch (tech_kwant_*)
  tech_kwant_longest_bias: boolean
  tech_kwant_homogeneity_score: float
  tech_kwant_absolute_terms_correct: text[]
  tech_kwant_absolute_terms_distractors: text[]
  tech_kwant_negation_detected: boolean
  tech_kwant_negation_emphasized: boolean
  tech_kwant_flags: text[]

  -- AI Betrouwbaarheid
  bet_discriminatie: text
  bet_ambiguiteit: text
  bet_score: smallint               -- check 1-5
  bet_toelichting: text

  -- AI Technisch Kwalitatief
  tech_kwal_stam_score: smallint
  tech_kwal_afleiders_score: smallint
  tech_kwal_score: smallint
  tech_problemen: text[]
  tech_toelichting: text

  -- AI Validiteit
  val_cognitief_niveau: text
  val_score: smallint
  val_toelichting: text

  -- Verbetering
  improvement_suggestions: jsonb    -- [{dimensie, suggestie}]
  assessed_at: timestamptz          -- tijdstip laatste beoordeling (herbeoordeling-detectie)
}

materials {
  id: uuid
  uploaded_by: uuid                 -- references auth.users(id)
  exam_id: uuid?
  filename: text
  mime_type: text
  storage_path: text                -- Supabase Storage path
  content_text: text
  chunk_count: int                  -- aantal chunks na embedding
}

chunks {
  id: uuid
  material_id: uuid
  position: int                     -- volgorde binnen materiaal
  text: text
  embedding: vector(768)            -- pgvector, HNSW index (multilingual-e5-base)
  page: int?
  metadata: jsonb
}

generation_jobs {
  id: uuid
  created_by: uuid                  -- references auth.users(id)
  material_id: uuid?                -- references materials(id)
  exam_id: uuid?                    -- references exams(id)
  specification: jsonb              -- {count, bloom_level, learning_goal, num_options}
  status: analysis_status           -- pending|processing|completed|failed
  result_question_ids: uuid[]
  error_message: text
  completed_at: timestamptz
}
```

### API-endpoints

De app combineert Supabase client SDK (directe database-queries met RLS) met custom Edge Functions voor AI-processing.

| Type | Endpoint / Pattern | Beschrijving |
|------|-------------------|--------------|
| `SDK` | `supabase.from('exams').insert()` | Nieuwe toets aanmaken (client-side, RLS) |
| `SDK` | `supabase.from('questions').select()` | Vragen ophalen met joins naar assessments |
| `SDK` | `supabase.storage.upload()` | Bestanden uploaden naar Supabase Storage bucket |
| `Edge Fn` | `POST /functions/v1/analyze` | Start validatie: deterministisch + AI pipeline |
| `Edge Fn` | `POST /functions/v1/generate` | MC-vragen genereren (RAG + LLM) |
| `Edge Fn` | `POST /functions/v1/embed-material` | Studiemateriaal chunken + embedden naar pgvector |
| `Edge Fn` | `GET /functions/v1/export/{format}` | Export als CSV, PDF of Markdown |
| `SDK` | `supabase.rpc('match_chunks', ...)` | Vector similarity search voor RAG retrieval |

### Supabase vector search functie

```sql
-- Postgres function voor RAG retrieval
create function match_chunks(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_material_id uuid default null
) returns table (
  id uuid,
  text text,
  page int,
  similarity float
) as $$
  select c.id, c.text, c.page,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where 1 - (c.embedding <=> query_embedding) > match_threshold
    and (filter_material_id is null or c.material_id = filter_material_id)
  order by c.embedding <=> query_embedding
  limit match_count;
$$ language sql;
```

---

## 09 · AI / LLM Strategie

De AI-integratie combineert deterministische regels met LLM-beoordeling en RAG-gebaseerde generatie. Elke component heeft een specifieke rol.

### Twee-lagige analyse-architectuur

> **Laag 1 — Deterministisch (snel, goedkoop, 100% reproduceerbaar):** Regelgebaseerde checks die altijd identieke output geven. Langste-antwoord-bias, homogeniteit, absolute termen, ontkenningen. Draait lokaal, geen API-kosten.

> **Laag 2 — LLM (kwalitatief, genuanceerd, kostbaar):** Beoordeling die menselijke interpretatie vereist: plausibiliteit van afleiders, semantische helderheid, cognitief niveau, discriminerend vermogen. Draait via API, kosten per vraag.

### Model-selectie & configuratie

| Taak | Model | Rationale |
|------|-------|-----------|
| Vraagvalidatie (3 dimensies) | Claude Sonnet 4.5 | Goede balans kwaliteit/kosten, sterk in structured output en Nederlandstalige instructies |
| Vraaggerneratie | Claude Sonnet 4.5 | Creativiteit + grounding via RAG, consistent in opvolgformat |
| Embedding (studiemateriaal) | multilingual-e5-base (in-container) | Open-source, geen API-kosten, goed in Nederlands |
| Fallback / complexe cases | Claude Opus 4.5 | Voor edge-cases die diepere analyse vereisen |

### RAG-pipeline (Module B)

```
R1 Ingest       →  R2 Chunk         →  R3 Embed          →  R4 Retrieve      →  R5 Generate
PDF/DOCX →         Splits op ~500      Vector-              Top-k relevante     LLM genereert
tekst extractie    tokens, overlap     representatie        chunks via           vragen grounded
→ cleaning         50, respect         per chunk,           supabase.rpc()      in retrieved
                   paragrafen          Supabase pgvector                        context
```

### Kwaliteitsborging AI-output

- **Structured output:** Alle LLM-responses in JSON-schema met validatie (pydantic/zod). Geen vrije tekst parsing.
- **Temperature-strategie:** Validatie op temp 0.0 (reproduceerbaar); generatie op temp 0.4-0.7 (creatief maar gecontroleerd).
- **Retry-logica:** Bij schema-validatiefouten maximaal 2 retries met error-feedback in prompt.
- **Grounding-check:** Gegenereerde vragen worden geverifieerd tegen bronchunks; vragen zonder duidelijke bron worden geflagd.
- **Consistentie-monitor:** Periodiek dezelfde vragen opnieuw valideren om LLM-drift te detecteren.

### Kostenmodel

| Operatie | Geschatte tokens | Kosten (indicatief) |
|----------|-----------------|---------------------|
| Validatie per vraag (3 dimensies) | ~2.500 in + ~800 out | ~€0,01–0,02 |
| Generatie per vraag (incl. RAG) | ~3.000 in + ~500 out | ~€0,01–0,03 |
| Embedding per chunk | ~500 tokens | ~€0,0001 |
| Typische toets (40 vragen validatie) | — | ~€0,50–1,00 |

---

## 10 · Prompt-architectuur

De prompts zijn gestructureerd in lagen: systeem-instructie, beoordelingscriteria, vraagspecifieke context en output-schema.

### Prompt-structuur: Validatie

```
// Laag 1: System prompt (vast per model-configuratie)
"Je bent een expert in toetsdidactiek en MC-vraaganalyse
voor het Nederlandse hoger onderwijs. Je beoordeelt
MC-vragen op drie dimensies: betrouwbaarheid, technische
kwaliteit en validiteit."

// Laag 2: Criteria (uit criteria-*.md bestanden)
<criteria_betrouwbaarheid>
  {inhoud van criteria-betrouwbaarheid.md}
</criteria_betrouwbaarheid>
<criteria_technisch>
  {inhoud van criteria-technisch.md}
</criteria_technisch>
<criteria_validiteit>
  {inhoud van criteria-validiteit.md}
</criteria_validiteit>

// Laag 3: Kwantitatieve vooranalyse (van deterministic analyzer)
<deterministic_results>
  {tech_kwant_* data als JSON}
</deterministic_results>

// Laag 4: De te beoordelen vraag
<question>
  stam: "Welke van de volgende..."
  opties: [A: "...", B: "...", C: "...", D: "..."]
  correct: "B"
  leerdoel: "Student kan X toepassen op Y"
</question>

// Laag 5: Output-schema (JSON)
<output_schema>
  {JSON schema met alle verwachte velden}
</output_schema>
```

### Prompt-structuur: Generatie

```
// System prompt
"Je bent een expert MC-vraagontwerper voor het
Nederlandse hoger onderwijs."

// Specificatie
<specification>
  aantal: 5
  bloom_niveau: "toepassen"
  leerdoel: "Student kan..."
  aantal_opties: 4
  taal: "Nederlands"
</specification>

// Bronmateriaal (RAG-retrieved chunks)
<source_material>
  <chunk id="c1" page="23">
    {relevante tekst uit studiemateriaal}
  </chunk>
  <chunk id="c2" page="45">
    {relevante tekst uit studiemateriaal}
  </chunk>
</source_material>

// Kwaliteitsinstructies
<quality_rules>
  - Elk antwoord moet grounded zijn in het bronmateriaal
  - Afleiders moeten plausibel zijn (veelgemaakte fouten)
  - Stam moet zelfstandig leesbaar zijn
  - Vermijd "alle bovenstaande" / "geen van bovenstaande"
  - Geef per vraag aan welke chunk(s) als bron dienden
</quality_rules>

// Output-schema
<output_schema>
  {JSON schema: array van gegenereerde vragen + metadata}
</output_schema>
```

### Prompt-beheer

- **Versioning:** Alle prompts opgeslagen met versienummer en timestamp. Wijzigingen zijn traceerbaar.
- **A/B-testing:** Mogelijkheid om twee promptversies parallel te draaien en output te vergelijken.
- **Few-shot voorbeelden:** Per beoordelingsdimensie 2-3 voorbeeldbeoordelingen als referentie in de prompt. Voorbeelden bevatten zowel goede als slechte vragen.
- **Criteria als configuratie:** De criteria-bestanden (.md) zijn de single source of truth. Wijzigingen in criteria propageren automatisch naar prompts.

---

## 11 · Export & Integraties

### Exportformaten

| Formaat | Inhoud | Use case |
|---------|--------|----------|
| **CSV** | Platte tabel met alle vragen, scores en metadata. Eén rij per vraag. | Data-analyse, import in Excel/SPSS, koppeling met itemanalyse na afname |
| **PDF** | Geformateerd rapport met samenvatting, per-vraag analyse, kleurcodes en grafieken | Toetscommissie-rapportage, archivering, vergaderingen |
| **Markdown** | Gestructureerd tekstbestand, ideaal voor versiebeheer en documentatie | Git-opslag, wiki-publicatie, verdere verwerking |

### Toekomstige integraties (Could)

- **QTI-export:** IMS Question & Test Interoperability-standaard voor import in LMS'en (Canvas, Brightspace, Moodle)
- **LMS-plugin:** Directe koppeling met het institutionele LMS voor import/export van vragenbanken
- **Webhook/API:** Koppeling met externe toetssystemen of itembanken

---

## 12 · Roadmap & Fasering

### Fase 1 — MVP Validatie (8-10 weken)

| Sprint | Deliverable |
|--------|-------------|
| 1-2 | Projectsetup, Supabase-project, datamodel + RLS, upload-parsing (CSV/Excel), deterministisch analyzer |
| 3-4 | AI-validatie pipeline (3 dimensies), structured output, prompt-templates |
| 5-6 | Dashboard frontend, radarcharts, heatmap, detail-view per vraag, filteren/sorteren |
| 7-8 | Export (CSV, PDF, Markdown), SSO-integratie via Supabase Auth, bugfixes |
| 9-10 | Pilot met 3-5 docenten, iteratie op feedback, productie-deploy |

### Fase 2 — Generatie + Verfijning (6-8 weken)

| Sprint | Deliverable |
|--------|-------------|
| 11-12 | RAG-pipeline: materiaal-upload naar Supabase Storage, chunking, embedding naar pgvector |
| 13-14 | Generatie-engine: vraagproductie met specificaties, inline validatie |
| 15-16 | Iteratief verfijnen UI, toetsmatrijs-koppeling, versiegeschiedenis |
| 17-18 | Uitgebreide pilot, prompt-tuning, performance-optimalisatie |

### Fase 3 — Uitbreiding (doorlopend)

- QTI-export en LMS-integratie
- Toetsmatrijs-gestuurd genereren
- Batch-revalidatie met voor/na vergelijking
- Instellingsbrede dashboards en trendanalyses
- Few-shot stijlreferentie bij generatie

---

## 13 · Risico's & Mitigatie

| Risico | Impact | Kans | Mitigatie |
|--------|--------|------|----------|
| **LLM-inconsistentie** — Dezelfde vraag krijgt bij herhaling verschillende scores | Hoog | Gemiddeld | Temperature 0.0 voor validatie, consistentie-monitoring, deterministisch als baseline, meervoudige evaluaties met meerderheidstem |
| **Hallucinatie bij generatie** — AI genereert feitelijk onjuiste vragen of antwoorden | Hoog | Gemiddeld | RAG-grounding, brontracering per vraag, menselijke review als verplichte stap, flag bij lage retrieval-confidence |
| **AVG / dataprivacy** — Toetsmateriaal bevat persoonsgegevens of gaat naar externe API | Hoog | Laag | DPIA uitvoeren, verwerkersovereenkomst met LLM-provider, Supabase EU-regio of self-hosted, optie voor on-premise LLM |
| **Adoptie door docenten** — Docenten vertrouwen AI-oordeel niet of vinden tool te complex | Gemiddeld | Gemiddeld | Transparante uitleg per score, human-in-the-loop principe, pilotfase met early adopters, training en support |
| **Over-reliance op AI** — Docenten accepteren AI-suggesties klakkeloos | Gemiddeld | Gemiddeld | Verplichte review-stap, disclaimers, geen "auto-fix" functionaliteit, educatie over tool als hulpmiddel |
| **Kosten bij opschaling** — API-kosten lopen op bij grootschalig gebruik | Laag | Gemiddeld | Kostenmonitoring per opleiding, caching van assessments, kleiner model voor eenvoudige checks, budgetlimieten |

---

*PRD v1.1 — MC Toetsvalidatie & Generatie Platform — Februari 2026 — Intern gebruik*
