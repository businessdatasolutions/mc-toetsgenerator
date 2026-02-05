# Takenlijst — MC Toetsvalidatie & Generatie Platform

Gebaseerd op TDD v1.0. Elke hoofdtaak bevat subtaken afgesloten met tests.
**Regel: ga pas door naar de volgende groep subtaken als alle tests groen zijn.**

---

## Fase 1 — MVP Validatie

### 1. Project Scaffold & Tooling

- [x] **1.1** Initialiseer Vite project met React + TypeScript template (`npm create vite@latest . -- --template react-ts`)
- [x] **1.2** Installeer dependencies: `tailwindcss @tailwindcss/vite react-router @supabase/supabase-js`
- [x] **1.3** Configureer Tailwind CSS v4: voeg `@tailwindcss/vite` plugin toe aan `vite.config.ts` en voeg `@import "tailwindcss"` toe aan `src/index.css`
- [x] **1.4** Stel `base: '/mc-toetsgenerator/'` in in `vite.config.ts`
- [x] **1.5** Maak `.env.example` met `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` placeholders
- [x] **1.6** Maak `.gitignore` met regels voor `node_modules/`, `dist/`, `.env`, `.DS_Store`
- [x] **1.7** Maak `public/404.html` met de SPA redirect-script (zie TDD sectie 9.1)
- [x] **1.8** Installeer test tooling: `vitest @testing-library/react @testing-library/jest-dom jsdom`
- [x] **1.9** Configureer Vitest in `vite.config.ts` (environment: jsdom, globals: true, setup file)
- [x] **1.10** Maak `src/test/setup.ts` met `import '@testing-library/jest-dom'`

#### Tests taak 1

- [x] **T1.1** `npm run dev` start zonder errors en toont de standaard Vite welkomstpagina
- [x] **T1.2** `npm run build` produceert een `dist/` map met `index.html` die relatieve paden met `/mc-toetsgenerator/` prefix bevat
- [x] **T1.3** `npx vitest run` slaagt (minimaal 1 dummy test die passed: `expect(true).toBe(true)`)
- [x] **T1.4** Tailwind classes worden correct verwerkt: maak een component met `className="text-red-500"` en verifieer dat de CSS in de build output zit

---

### 2. Supabase Project & Database Schema

- [x] **2.1** Maak een Supabase project aan (EU-regio) via dashboard of CLI (`supabase init` lokaal)
- [x] **2.2** Maak de eerste migratie: `supabase migration new initial_schema`
- [x] **2.3** Schrijf SQL voor extensies: `pgvector` en `pg_net`
- [x] **2.4** Schrijf SQL voor enum types: `bloom_level`, `question_source`, `analysis_status`, `discriminatie_level`, `ambiguiteit_level`
- [x] **2.5** Schrijf SQL voor tabel `exams` met alle kolommen, primary key, default values en index op `created_by` (zie TDD sectie 3.1)
- [x] **2.6** Schrijf SQL voor tabel `questions` met foreign key naar `exams`, `valid_options` check constraint, en index op `exam_id`
- [x] **2.7** Schrijf SQL voor tabel `assessments` met alle `tech_kwant_*`, `bet_*`, `tech_kwal_*`, `val_*` kolommen, check constraints (1-5), unique constraint op `(question_id, question_version)`, en index
- [x] **2.8** Schrijf SQL voor tabel `materials` met foreign keys naar `auth.users` en `exams`
- [x] **2.9** Schrijf SQL voor tabel `chunks` met `vector(1536)` kolom, HNSW index op embedding, en foreign key naar `materials`
- [x] **2.10** Schrijf SQL voor tabel `generation_jobs` met foreign keys en `specification` jsonb kolom
- [x] **2.11** Pas migratie toe: `supabase db push` of `supabase migration up`

#### Tests taak 2

- [x] **T2.1** Migratie is succesvol: `supabase db push` geeft geen errors
- [x] **T2.2** Alle 6 tabellen bestaan: voer `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'` uit en verifieer dat `exams`, `questions`, `assessments`, `materials`, `chunks`, `generation_jobs` aanwezig zijn
- [x] **T2.3** Enum types bestaan: `SELECT typname FROM pg_type WHERE typname IN ('bloom_level','question_source','analysis_status','discriminatie_level','ambiguiteit_level')` geeft 5 rijen
- [x] **T2.4** Insert een test-exam, een test-question, en een test-assessment en verifieer dat constraints werken (bijv. `bet_score = 6` moet falen, `options` met 1 element moet falen)
- [x] **T2.5** pgvector extensie werkt: `SELECT '[1,2,3]'::vector(3)` geeft geen error

---

### 3. Row Level Security & Database Functies

- [x] **3.1** Maak migratie: `supabase migration new rls_policies`
- [x] **3.2** Schakel RLS in op alle 6 tabellen (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [x] **3.3** Schrijf RLS policy voor `exams`: gebruiker kan alleen eigen exams CRUD-en (`auth.uid() = created_by`)
- [x] **3.4** Schrijf RLS policy voor `questions`: toegang via exam ownership
- [x] **3.5** Schrijf RLS policies voor `assessments`: SELECT via question→exam ownership, INSERT alleen voor service_role
- [x] **3.6** Schrijf RLS policy voor `materials`: gebruiker kan alleen eigen uploads CRUD-en
- [x] **3.7** Schrijf RLS policy voor `chunks`: SELECT via material ownership
- [x] **3.8** Maak migratie: `supabase migration new database_functions`
- [x] **3.9** Schrijf de `match_chunks()` functie (vector similarity search, zie TDD sectie 3.3)
- [x] **3.10** Schrijf de `exam_score_summary()` functie (geaggregeerde scores, zie TDD sectie 3.3)

#### Tests taak 3

- [x] **T3.1** Migraties zijn succesvol toegepast
- [x] **T3.2** RLS test: maak twee test-users via Supabase Auth. User A maakt een exam. User B mag dat exam NIET zien via een SDK query met User B's token
- [x] **T3.3** RLS test: User A kan eigen exam wel zien en updaten
- [x] **T3.4** Service role kan assessments inserten ongeacht ownership
- [x] **T3.5** `match_chunks()` functie is aanroepbaar: `SELECT * FROM match_chunks('[0.1, 0.2, ...]'::vector(1536))` geeft geen error (lege result set is ok)
- [x] **T3.6** `exam_score_summary()` geeft correcte aggregatie voor een exam met 3 vragen met bekende scores

---

### 4. Frontend Auth & Routing

- [x] **4.1** Maak `src/lib/supabase.ts`: exporteer `createClient<Database>(url, anonKey)` met env vars
- [x] **4.2** Maak `src/lib/types.ts` met TypeScript interfaces: `Exam`, `Question`, `QuestionOption`, `Assessment`, `Material` (spiegelend aan de database tabellen)
- [x] **4.3** Maak `src/context/AuthContext.tsx`: React context provider die `supabase.auth.getSession()` aanroept bij mount en `onAuthStateChange` luistert. Exporteert `useAuth()` hook met `session`, `user`, `loading`, `signIn()`, `signOut()`
- [x] **4.4** Maak `src/components/Layout/ProtectedRoute.tsx`: wrapper die redirect naar login als `session === null`
- [x] **4.5** Maak `src/components/Layout/Navbar.tsx`: navigatiebalk met links naar Home, Upload, Genereer. Toont gebruikersnaam en logout-knop als ingelogd
- [x] **4.6** Maak `src/App.tsx`: root layout component die `AuthContext.Provider` wrapt, `Navbar` toont, en een `<Outlet />` rendert voor child routes
- [x] **4.7** Maak placeholder route-componenten (lege componenten met alleen een `<h1>` titel): `Home.tsx`, `ExamUpload.tsx`, `ExamParsing.tsx`, `ExamDashboard.tsx`, `QuestionDetail.tsx`, `Export.tsx`, `MaterialUpload.tsx`, `GenerateSpec.tsx`, `GenerateReview.tsx`
- [x] **4.8** Configureer React Router in `src/main.tsx` met `createBrowserRouter` en `basename: "/mc-toetsgenerator"`. Definieer alle routes volgens TDD sectie 2.3
- [x] **4.9** Maak een simpele login-pagina (`src/routes/Login.tsx`) die `supabase.auth.signInWithPassword()` aanroept (voor development; SSO komt later)

#### Tests taak 4

- [x] **T4.1** Unit test `AuthContext`: mock `supabase.auth.getSession()` en verifieer dat `useAuth()` hook `session` en `user` correct retourneert
- [x] **T4.2** Unit test `ProtectedRoute`: rendert children als session aanwezig, redirect naar `/login` als session null
- [x] **T4.3** Navigatie test: render de router, navigeer naar `/exams/upload` en verifieer dat `ExamUpload` component gerenderd wordt (check op h1 tekst)
- [x] **T4.4** `npm run build` slaagt zonder TypeScript errors
- [ ] **T4.5** Handmatige check: `npm run dev`, open browser, login-pagina wordt getoond. Na inloggen (met test-user uit Supabase dashboard) wordt Home getoond

---

### 5. Python Sidecar Scaffold & Deterministische Analyzer

- [x] **5.1** Maak de directory `sidecar/` met `main.py`, `requirements.txt`, `Dockerfile`
- [x] **5.2** Schrijf `requirements.txt`: `fastapi`, `uvicorn[standard]`, `anthropic`, `pydantic`, `pydantic-settings`, `supabase`, `openpyxl`, `python-docx`, `pdfplumber`, `httpx`, `pytest`, `pytest-asyncio`
- [x] **5.3** Maak `sidecar/config/settings.py`: Pydantic `Settings` class die leest uit env vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`
- [x] **5.4** Maak `sidecar/main.py`: FastAPI app met `/health` endpoint dat `{"status": "ok"}` retourneert
- [x] **5.5** Maak `sidecar/analyzers/schemas.py`: `DeterministicResult` dataclass met alle `tech_kwant_*` velden (zie TDD sectie 5.2)
- [x] **5.6** Maak `sidecar/analyzers/deterministic.py` met functie `analyze(question) -> DeterministicResult`:
  - **5.6a** Implementeer langste-antwoord-bias check: correct antwoord >50% langer dan gemiddelde lengte van afleiders → `tech_kwant_longest_bias = True`
  - **5.6b** Implementeer homogeniteitscore: bereken standaarddeviatie van alle antwoordlengtes (in karakters), normaliseer naar 0.0–1.0 (1.0 = perfect homogeen) → `tech_kwant_homogeneity_score`
  - **5.6c** Implementeer absolute-termen detectie: scan correct antwoord en afleiders apart op de woordenlijst: `altijd, nooit, alle, geen, elke, iedere, uitsluitend, alleen, volledig, absoluut, zonder uitzondering` → `tech_kwant_absolute_terms_correct` en `tech_kwant_absolute_terms_distractors`
  - **5.6d** Implementeer ontkenning-detectie in stam: zoek naar `niet, geen, behalve, uitgezonderd` → `tech_kwant_negation_detected`
  - **5.6e** Implementeer ontkenning-nadruk check: controleer of gevonden ontkenning in hoofdletters (`NIET`) of markdown bold (`**niet**`) staat → `tech_kwant_negation_emphasized`
  - **5.6f** Genereer `tech_kwant_flags` lijst: voeg beschrijvende strings toe voor elk gedetecteerd probleem (bijv. `"langste-antwoord-bias"`, `"absolute-termen-in-correct-antwoord"`, `"ontkenning-zonder-nadruk"`)
- [x] **5.7** Maak `sidecar/services/supabase_client.py`: initialiseer Supabase client met service role key

#### Tests taak 5

- [x] **T5.1** `cd sidecar && pip install -r requirements.txt` installeert zonder errors
- [x] **T5.2** `cd sidecar && uvicorn main:app` start op en `curl localhost:8000/health` retourneert `{"status": "ok"}`
- [x] **T5.3** Pytest: langste-antwoord-bias detectie:
  - Input: stam="Wat is X?", opties=["Kort", "Kort", "Dit is een heel lang antwoord dat duidelijk langer is", "Kort"], correct=2 → `tech_kwant_longest_bias = True`
  - Input: stam="Wat is X?", opties=["Optie A hier", "Optie B hier", "Optie C hier", "Optie D hier"], correct=0 → `tech_kwant_longest_bias = False`
- [x] **T5.4** Pytest: homogeniteitscore:
  - Input met identieke lengte opties → score dicht bij 1.0
  - Input met sterk varierende lengte → score dicht bij 0.0
- [x] **T5.5** Pytest: absolute-termen detectie:
  - Input: correct antwoord bevat "altijd" → `tech_kwant_absolute_terms_correct = ["altijd"]`
  - Input: afleider bevat "nooit" en "alle" → `tech_kwant_absolute_terms_distractors = ["nooit", "alle"]`
  - Input: geen absolute termen → beide lijsten leeg
- [x] **T5.6** Pytest: ontkenning-detectie:
  - Stam "Welke stelling is NIET correct?" → `negation_detected=True`, `negation_emphasized=True`
  - Stam "Welke stelling is niet correct?" → `negation_detected=True`, `negation_emphasized=False`
  - Stam "Welke stelling is correct?" → `negation_detected=False`
- [x] **T5.7** Pytest: flags generatie: een vraag met langste-antwoord-bias EN ontkenning-zonder-nadruk levert `tech_kwant_flags` met minstens 2 items

---

### 6. LLM Client & Structured Output

- [x] **6.1** Maak `sidecar/llm/schemas.py` met alle Pydantic models: `ImprovementSuggestion`, `ValidationResult`, `QuestionOption`, `GeneratedQuestion`, `GenerationResult` (zie TDD sectie 5.5)
- [x] **6.2** Maak `sidecar/llm/prompts/validation.py` met `SYSTEM_PROMPT_VALIDATION` constante en `build_validation_prompt()` functie (zie TDD sectie 5.4). De functie leest de drie criteria markdown bestanden en bouwt de 4-lagen prompt op
- [x] **6.3** Kopieer of symlink de criteria bestanden naar `sidecar/criteria/`: `betrouwbaarheid.md`, `technisch.md`, `validiteit.md`
- [x] **6.4** Maak `sidecar/llm/client.py` met `LLMClient` class:
  - **6.4a** Constructor: initialiseer `anthropic.Anthropic()`, sla model names op (`claude-sonnet-4-5-20241022`, `claude-opus-4-5-20250514`)
  - **6.4b** `validate_question()` method: roep `client.messages.parse()` aan met `output_format=ValidationResult`, temperature=0.0 (zie TDD sectie 5.3)
  - **6.4c** Foutafhandeling: vang `stop_reason == "refusal"` en `stop_reason == "max_tokens"` af en raise een custom exception met duidelijk bericht
- [x] **6.5** Maak `sidecar/services/validation_pipeline.py` met `run_validation(exam_id)`:
  - **6.5a** Haal vragen op uit Supabase via service role client
  - **6.5b** Per vraag: draai `deterministic.analyze()`, dan `llm_client.validate_question()`
  - **6.5c** Schrijf de gecombineerde resultaten (deterministic + LLM) als assessment naar Supabase
  - **6.5d** Update `exams.analysis_status` naar `'completed'` (of `'failed'` bij errors)
  - **6.5e** Gebruik `asyncio.gather()` met `max_concurrency=5` (semaphore) voor parallelle LLM calls
- [x] **6.6** Voeg POST `/analyze` route toe aan `sidecar/main.py`: accepteert `{exam_id: str}`, roept `run_validation()` aan

#### Tests taak 6

- [x] **T6.1** Pytest: `ValidationResult` Pydantic model accepteert correcte data en reject ongeldige data (bijv. `bet_score=6` faalt, `bet_discriminatie="ongeldig"` faalt)
- [x] **T6.2** Pytest: `build_validation_prompt()` retourneert een list met 2 dicts (system + user). De user content bevat alle drie criteria XML-tags en de `<question>` en `<deterministic_results>` tags
- [x] **T6.3** Pytest: `build_validation_prompt()` bevat GEEN `<output_schema>` tag (want structured output regelt dat)
- [ ] **T6.4** Integratietest (vereist `ANTHROPIC_API_KEY` env var): roep `llm_client.validate_question()` aan met een voorbeeld MC-vraag. Verifieer dat het resultaat een `ValidationResult` instance is met alle velden gevuld, scores tussen 1-5, en `bet_discriminatie` in `["hoog","gemiddeld","laag","geen"]`
- [x] **T6.5** Pytest: `validation_pipeline` — mock de Supabase client en LLM client. Verifieer dat voor 3 vragen: 3 deterministic analyses draaien, 3 LLM calls plaatsvinden, 3 assessments geschreven worden, en de exam status geüpdatet wordt

---

### 7. Supabase Edge Functions

- [x] **7.1** Initialiseer Supabase Edge Functions: `supabase functions new analyze`
- [x] **7.2** Schrijf `supabase/functions/analyze/index.ts`:
  - **7.2a** Valideer dat request body `exam_id` (string, UUID) bevat
  - **7.2b** Controleer auth: haal de user session op uit de Authorization header
  - **7.2c** Verifieer dat de user eigenaar is van het exam (query naar `exams` tabel)
  - **7.2d** Update `exams.analysis_status` naar `'processing'`
  - **7.2e** Doe een HTTP POST naar de Python sidecar URL (`/analyze`) met `{exam_id}` — fire-and-forget (wacht niet op resultaat)
  - **7.2f** Retourneer `{job_id, status: "processing", question_count}`
- [x] **7.3** Maak `supabase functions new embed-material` en schrijf `index.ts`:
  - **7.3a** Valideer `material_id`, controleer ownership
  - **7.3b** POST naar sidecar `/embed` met `{material_id}`
  - **7.3c** Retourneer `{status: "processing", filename}`
- [x] **7.4** Maak `supabase functions new export` en schrijf `index.ts`:
  - **7.4a** Accepteer query params `exam_id` en `format` (csv/pdf/markdown)
  - **7.4b** Haal alle vragen + assessments op voor het exam
  - **7.4c** Genereer export in het gevraagde formaat (CSV in Deno: handmatig string-bouwen; PDF/Markdown: via sidecar of inline template)
  - **7.4d** Retourneer als binary download met correcte Content-Type header

#### Tests taak 7

- [x] **T7.1** Deploy Edge Functions naar Supabase: `supabase functions deploy analyze`, `supabase functions deploy embed-material`, `supabase functions deploy export` — alle drie slagen
- [ ] **T7.2** Handmatige test: stuur een `POST` naar `/functions/v1/analyze` met een geldig exam_id en Authorization header. Verifieer dat response status 200 is en body `{job_id, status: "processing"}` bevat
- [x] **T7.3** Auth test: stuur een request zonder Authorization header → verwacht 401
- [ ] **T7.4** Ownership test: stuur een request met User B's token voor User A's exam → verwacht 403
- [ ] **T7.5** Export test: stuur `GET /functions/v1/export?exam_id=...&format=csv` → verifieer dat response Content-Type `text/csv` is en body geldige CSV bevat met kolommen voor stam, scores, flags

---

### 8. Upload & Parsing (Frontend + Sidecar)

- [x] **8.1** Maak `src/components/FileUploader.tsx`: drag-and-drop component die bestanden accepteert (.csv, .xlsx, .docx), een preview toont van de filename en grootte, en een `onFileSelected(file: File)` callback aanroept
- [x] **8.2** Implementeer `src/routes/ExamUpload.tsx`:
  - **8.2a** Formulier met velden: toets titel, vaknaam, leerdoelen (comma-separated text input)
  - **8.2b** FileUploader component voor het bestand
  - **8.2c** Submit handler: maak een nieuw exam record in Supabase, upload het bestand naar Supabase Storage bucket `uploads`, navigeer naar `/exams/:examId/parse`
- [x] **8.3** Maak `sidecar/parsers/` directory met `csv_parser.py`, `xlsx_parser.py`, `docx_parser.py`
- [x] **8.4** Implementeer `csv_parser.py`: lees CSV met kolommen `stam, optie_a, optie_b, optie_c, optie_d, correct`. Retourneer een lijst van `Question` objecten. Ondersteun zowel `;` als `,` als delimiter. Valideer dat `correct` verwijst naar een bestaande optie
- [x] **8.5** Implementeer `xlsx_parser.py`: lees Excel met dezelfde kolomstructuur via `openpyxl`. Retourneer dezelfde output als csv_parser
- [x] **8.6** Implementeer `docx_parser.py`: parse genummerde vragen uit DOCX. Herken patronen als "1. [stam]\nA. [optie]\nB. [optie]\n..." en het correcte antwoord aangeduid met asterisk (*) of vet. Retourneer dezelfde output
- [x] **8.7** Voeg POST `/parse` route toe aan sidecar: accepteert een bestand (multipart upload), detecteert type op basis van extensie, roept juiste parser aan, retourneert JSON array van parsed vragen
- [x] **8.8** Implementeer `src/routes/ExamParsing.tsx`:
  - **8.8a** Haal parsed vragen op (call naar sidecar `/parse` of direct client-side parsing voor CSV)
  - **8.8b** Toon een tabel met alle vragen: rijnummer, stam (truncated), aantal opties, correct antwoord
  - **8.8c** Klikbaar per rij: open inline editor om stam, opties, correct antwoord aan te passen
  - **8.8d** "Opslaan & Analyseren" knop: schrijf alle vragen naar `questions` tabel in Supabase, trigger analyse via Edge Function

#### Tests taak 8

- [x] **T8.1** Pytest `csv_parser`: parse een test CSV bestand met 5 vragen, verifieer dat alle 5 correct geparsed worden met juiste stam, opties, en correct_option index
- [x] **T8.2** Pytest `csv_parser`: CSV met ontbrekende kolom → raise duidelijke error
- [x] **T8.3** Pytest `xlsx_parser`: parse een test Excel bestand met 3 vragen → correcte output
- [x] **T8.4** Pytest `docx_parser`: parse een test DOCX met genummerde vragen en vetgedrukt correct antwoord → correcte output
- [x] **T8.5** React test `FileUploader`: render component, simuleer een file drop, verifieer dat `onFileSelected` callback aangeroepen wordt met het juiste File object
- [x] **T8.6** React test `ExamUpload`: render component, vul formulier in, verifieer dat submit handler Supabase `insert` en `storage.upload` aanroept (mock Supabase client)
- [x] **T8.7** Sidecar integratietest: POST een CSV bestand naar `/parse` endpoint, verifieer dat response een JSON array is met correcte question objecten

---

### 9. Dashboard Frontend

- [x] **9.1** Maak `src/hooks/useExam.ts`: custom hook die een exam ophaalt op basis van `examId` URL param, inclusief realtime subscription op `exams.analysis_status` veranderingen
- [x] **9.2** Maak `src/hooks/useQuestions.ts`: custom hook die vragen + assessments ophaalt voor een exam (`supabase.from('questions').select('*, assessments(*)').eq('exam_id', id)`)
- [x] **9.3** Maak `src/components/ScoreBadge.tsx`: component dat een score (1-5) als badge toont. Kleuren: 1-2 = rood (`bg-red-500`), 3 = geel (`bg-yellow-500`), 4-5 = groen (`bg-green-500`). Toont het getal in de badge
- [x] **9.4** Maak `src/components/BloomBadge.tsx`: component dat een Bloom-niveau toont als gekleurd label. Kleuren: Onthouden = grijs, Begrijpen = blauw, Toepassen = teal, Analyseren = goud
- [x] **9.5** Maak `src/components/QuestionCard.tsx`: compact kaartje per vraag met: vraagnummer, stam (eerste 80 karakters), 3 ScoreBadges (B/T/V), BloomBadge, en een link naar de detail-pagina
- [x] **9.6** Maak `src/components/RadarChart.tsx`: driehoekig radardiagram met drie assen (Betrouwbaarheid, Technisch, Validiteit). Gebruik SVG of een lichtgewicht chart library. Input: `{bet: number, tech: number, val: number}` (elk 1-5)
- [x] **9.7** Maak `src/components/Heatmap.tsx`: matrix-tabel met rijen = vragen, kolommen = B/T/V. Elke cel heeft achtergrondkleur op basis van score (1=donkerrood, 5=donkergroen). Sorteerbaar per kolom
- [x] **9.8** Implementeer `src/routes/ExamDashboard.tsx`:
  - **9.8a** Bovenaan: 3 KPI-kaarten met gemiddelde score per dimensie (roep `exam_score_summary()` RPC aan)
  - **9.8b** Daaronder: Heatmap component met alle vragen
  - **9.8c** Daaronder: lijst van QuestionCards, sorteerbaar en filterbaar (filter op score-range, Bloom-niveau)
  - **9.8d** "Aandachtsvragen" sectie: toon vragen waar minstens 1 dimensie ≤ 2
  - **9.8e** Loading state tonen terwijl `analysis_status === 'processing'`, met realtime update naar resultaten wanneer `'completed'`
- [x] **9.9** Implementeer `src/routes/QuestionDetail.tsx`:
  - **9.9a** Toon volledige vraag: stam, alle opties met markering van correct antwoord
  - **9.9b** RadarChart met de drie dimensiescores
  - **9.9c** Per dimensie een uitklapbare sectie met: score, toelichting (`*_toelichting`), en voor technisch: de deelscores (stam, afleiders) en deterministic flags
  - **9.9d** Verbetervoorstellen lijst uit `improvement_suggestions`
  - **9.9e** "Bewerk" knop die een inline editor opent voor stam en opties

#### Tests taak 9

- [x] **T9.1** React test `ScoreBadge`: render met score 1 → bevat klasse `bg-red-500`; score 3 → `bg-yellow-500`; score 5 → `bg-green-500`
- [x] **T9.2** React test `BloomBadge`: render met "toepassen" → toont "Toepassen" met teal styling
- [x] **T9.3** React test `QuestionCard`: render met mock vraag + assessment data, verifieer dat stam, 3 scores, en Bloom-badge zichtbaar zijn
- [x] **T9.4** React test `Heatmap`: render met 5 mock vragen, verifieer dat 5 rijen en 3 kolommen gerenderd worden
- [x] **T9.5** React test `ExamDashboard`: mock Supabase hooks, render met 3 vragen, verifieer dat KPI-kaarten, heatmap, en question cards gerenderd worden
- [x] **T9.6** React test `QuestionDetail`: render met mock vraag + assessment, verifieer dat stam, opties, radar chart, toelichtingen, en verbetervoorstellen zichtbaar zijn
- [x] **T9.7** `npm run build` slaagt zonder TypeScript errors

---

### 10. Export Functionaliteit

- [x] **10.1** Maak `src/lib/api.ts`: wrapper functie `exportExam(examId: string, format: 'csv' | 'pdf' | 'markdown')` die de Edge Function aanroept en het bestand download
- [x] **10.2** Implementeer `src/routes/Export.tsx`:
  - **10.2a** Toon 3 knoppen: CSV, PDF, Markdown
  - **10.2b** Bij klik: roep `exportExam()` aan, toon loading indicator, trigger browser download bij succes
  - **10.2c** Foutmelding tonen bij failure
- [x] **10.3** Implementeer CSV export in de Edge Function: genereer CSV string met kolommen: `vraagnummer, stam, correct_antwoord, bloom_niveau, bet_score, tech_kwal_score, val_score, tech_kwant_flags, improvement_suggestions`
- [x] **10.4** Implementeer Markdown export in de Edge Function: genereer gestructureerd Markdown rapport met overzichtstabel en per-vraag detail secties

#### Tests taak 10

- [x] **T10.1** React test `Export`: render component, klik op "CSV" knop, verifieer dat `exportExam()` aangeroepen wordt met format "csv"
- [ ] **T10.2** Edge Function test: roep export aan met format=csv voor een exam met 3 vragen, verifieer dat CSV output 4 regels bevat (1 header + 3 vragen) en alle score-kolommen aanwezig zijn
- [ ] **T10.3** Edge Function test: roep export aan met format=markdown, verifieer dat output geldige Markdown is met `#` headers en een tabel

---

### 11. GitHub Pages Deployment

- [x] **11.1** Maak `.github/workflows/deploy.yml` met de GitHub Actions workflow (zie TDD sectie 9.1): checkout, setup node 22, npm ci, npm run build met env vars uit secrets, upload pages artifact, deploy to pages
- [ ] **11.2** Configureer GitHub repository settings: enable GitHub Pages met "GitHub Actions" als source (NOTE: vereist publieke repo of GitHub Pro plan)
- [x] **11.3** Voeg `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY` toe als repository secrets in GitHub
- [x] **11.4** Maak een initial commit en push naar `main`

#### Tests taak 11

- [ ] **T11.1** GitHub Actions workflow runt succesvol: build stap slaagt, deploy stap slaagt (NOTE: wacht op Pages enablement)
- [ ] **T11.2** De site is bereikbaar op `https://<username>.github.io/mc-toetsgenerator/`
- [ ] **T11.3** SPA routing werkt: navigeer direct naar `https://<username>.github.io/mc-toetsgenerator/exams/upload` → de Upload pagina wordt getoond (niet een 404)
- [ ] **T11.4** Supabase connectie werkt: de login-pagina kan communiceren met Supabase Auth

---

## Fase 2 — Generatie

### 12. RAG Pipeline — Materiaal Verwerking

- [ ] **12.1** Maak `sidecar/rag/extractor.py` met functies:
  - **12.1a** `extract_pdf(file_bytes) -> list[PageText]`: gebruik `pdfplumber` om per pagina tekst te extraheren. `PageText` bevat `page_number: int` en `text: str`
  - **12.1b** `extract_docx(file_bytes) -> str`: gebruik `python-docx` om alle paragrafen te joinen
  - **12.1c** `extract_text(file_bytes, mime_type) -> str | list[PageText]`: dispatch naar juiste extractor op basis van mime type
- [ ] **12.2** Maak `sidecar/rag/chunker.py` met `chunk_text(text, metadata) -> list[Chunk]`:
  - **12.2a** Splits tekst in chunks van ~500 tokens (schat met `len(text) / 4` als heuristiek) met 50 tokens overlap
  - **12.2b** Respecteer paragraafgrenzen: splits bij voorkeur op dubbele newlines
  - **12.2c** Elk chunk-object bevat: `text`, `page` (indien beschikbaar), `position` (index), `metadata`
- [ ] **12.3** Maak `sidecar/rag/embedder.py` met `embed_chunks(chunks) -> list[list[float]]`:
  - **12.3a** Gebruik OpenAI API (`text-embedding-3-small` model)
  - **12.3b** Batch chunks in groepen van 100 per API request
  - **12.3c** Retourneer lijst van 1536-dimensionale float vectors
- [ ] **12.4** Maak `sidecar/services/embedding_pipeline.py` met `run_embedding(material_id)`:
  - **12.4a** Download bestand uit Supabase Storage via service role client
  - **12.4b** Extraheer tekst (dispatch op mime type)
  - **12.4c** Chunk de tekst
  - **12.4d** Genereer embeddings
  - **12.4e** Schrijf chunks + embeddings naar `chunks` tabel in Supabase
  - **12.4f** Update `materials.content_text` en `materials.chunk_count`
- [ ] **12.5** Voeg POST `/embed` route toe aan `sidecar/main.py`

#### Tests taak 12

- [ ] **T12.1** Pytest `extract_pdf`: parse een test PDF bestand (maak een simpele test PDF met reportlab of gebruik een fixture), verifieer dat tekst per pagina correct geextraheerd wordt
- [ ] **T12.2** Pytest `extract_docx`: parse een test DOCX, verifieer dat alle paragrafen in de output staan
- [ ] **T12.3** Pytest `chunk_text`: input van 2000 woorden → verifieer dat er meerdere chunks zijn, elk ≤600 tokens (~2400 karakters), met overlap (laatste 50 tokens van chunk N = eerste 50 tokens van chunk N+1)
- [ ] **T12.4** Pytest `chunk_text`: korte input van 100 woorden → verifieer dat er precies 1 chunk is
- [ ] **T12.5** Pytest `embed_chunks` (mock OpenAI API): verifieer dat de functie batches van max 100 stuurt en vectors van 1536 dimensies retourneert
- [ ] **T12.6** Integratietest `embedding_pipeline` (mock Supabase + mock OpenAI): verifieer dat de volledige flow draait: download → extract → chunk → embed → insert chunks → update material

---

### 13. RAG Retrieval & Vraaggerneratie

- [ ] **13.1** Maak `sidecar/rag/retriever.py` met `retrieve_chunks(query, material_id, top_k=5) -> list[Chunk]`:
  - **13.1a** Genereer embedding voor de query tekst via OpenAI
  - **13.1b** Roep Supabase RPC `match_chunks()` aan met de query embedding en material_id filter
  - **13.1c** Retourneer top-k chunks gesorteerd op similarity
- [ ] **13.2** Maak `sidecar/llm/prompts/generation.py`:
  - **13.2a** Definieer `SYSTEM_PROMPT_GENERATION` constante
  - **13.2b** Implementeer `build_generation_prompt(specification, chunks, criteria)` die de 4-lagen prompt bouwt: system, specificatie, bronmateriaal chunks (met pagina-referenties), kwaliteitsregels
- [ ] **13.3** Voeg `generate_questions()` method toe aan `LLMClient` (als nog niet volledig geimplementeerd): roep `client.messages.parse()` aan met `output_format=GenerationResult`, temperature=0.5
- [ ] **13.4** Maak `sidecar/services/generation_pipeline.py` met `run_generation(job_id)`:
  - **13.4a** Lees `generation_jobs` record uit Supabase om specification en material_id op te halen
  - **13.4b** Retrieve relevante chunks via `retriever.retrieve_chunks()` met het leerdoel als query
  - **13.4c** Genereer vragen via `llm_client.generate_questions()`
  - **13.4d** Schrijf gegenereerde vragen naar `questions` tabel (met `source='generated'`)
  - **13.4e** Draai automatisch de validatie pipeline op de gegenereerde vragen (hergebruik `validation_pipeline`)
  - **13.4f** Update `generation_jobs.status` en `generation_jobs.result_question_ids`
- [ ] **13.5** Voeg POST `/generate` route toe aan `sidecar/main.py`
- [ ] **13.6** Maak `supabase functions new generate` Edge Function:
  - **13.6a** Valideer request: `material_id`, `specification` (count, bloom_level, learning_goal, num_options)
  - **13.6b** Maak `generation_jobs` record aan
  - **13.6c** POST naar sidecar `/generate` met `{job_id}` — fire-and-forget
  - **13.6d** Retourneer `{job_id, status: "processing"}`

#### Tests taak 13

- [ ] **T13.1** Pytest `retrieve_chunks` (mock OpenAI + mock Supabase RPC): verifieer dat een query leidt tot een embedding call en een `match_chunks` RPC call met correcte parameters
- [ ] **T13.2** Pytest `build_generation_prompt`: verifieer dat output system prompt, `<specification>` tag, `<source_material>` met chunk tags, en `<quality_rules>` bevat
- [ ] **T13.3** Integratietest (vereist `ANTHROPIC_API_KEY`): roep `llm_client.generate_questions()` aan met 2 dummy chunks en specificatie voor 2 vragen op Bloom-niveau "toepassen". Verifieer dat resultaat 2 `GeneratedQuestion` objecten bevat met alle velden gevuld en `source_chunk_ids` die verwijzen naar de meegegeven chunks
- [ ] **T13.4** Pytest `generation_pipeline` (mock alles): verifieer de volledige flow: lees job → retrieve chunks → generate → insert questions → run validation → update job
- [ ] **T13.5** Edge Function test: POST naar `/functions/v1/generate` met geldige data → response bevat `{job_id, status: "processing"}` en een `generation_jobs` record is aangemaakt in de database

---

### 14. Generatie Frontend

- [ ] **14.1** Implementeer `src/routes/MaterialUpload.tsx`:
  - **14.1a** FileUploader component die PDF, DOCX, en TXT accepteert
  - **14.1b** Upload bestand naar Supabase Storage bucket `materials`
  - **14.1c** Maak `materials` record in Supabase
  - **14.1d** Trigger embedding via Edge Function `embed-material`
  - **14.1e** Toon processing indicator, wacht op chunk_count > 0 via polling of realtime
  - **14.1f** Na verwerking: navigeer naar `/generate` met material_id als state
- [ ] **14.2** Implementeer `src/routes/GenerateSpec.tsx`:
  - **14.2a** Selecteer materiaal (dropdown met eerder geüploade materials)
  - **14.2b** Invoervelden: aantal vragen (number input, 1-20), Bloom-niveau (select: onthouden/begrijpen/toepassen/analyseren), leerdoel (text input), aantal opties (radio: 3 of 4)
  - **14.2c** Optioneel: koppel aan bestaand exam (select dropdown)
  - **14.2d** "Genereer" knop: POST naar Edge Function `/generate`, navigeer naar review pagina
- [ ] **14.3** Maak `src/hooks/useGenerationJob.ts`: poll `generation_jobs` status elke 3 seconden tot status != 'pending'/'processing'
- [ ] **14.4** Implementeer `src/routes/GenerateReview.tsx`:
  - **14.4a** Toon loading state terwijl job processing is
  - **14.4b** Na completion: toon lijst van gegenereerde vragen als QuestionCards met scores
  - **14.4c** Per vraag: "Accepteren" knop (behoudt vraag), "Verwijderen" knop (verwijdert uit questions tabel)
  - **14.4d** Inline editor per vraag om stam/opties aan te passen voor acceptatie
  - **14.4e** "Alles accepteren & exporteren" knop die naar Export pagina navigeert

#### Tests taak 14

- [ ] **T14.1** React test `MaterialUpload`: render, simuleer file drop + submit, verifieer dat Supabase storage upload en materials insert aangeroepen worden
- [ ] **T14.2** React test `GenerateSpec`: render, vul alle velden in, klik "Genereer", verifieer dat Edge Function call gedaan wordt met correcte specification
- [ ] **T14.3** React test `GenerateReview`: render met mock generation job (status 'completed') en 3 gegenereerde vragen, verifieer dat 3 QuestionCards gerenderd worden met "Accepteren" en "Verwijderen" knoppen
- [ ] **T14.4** React test `GenerateReview`: klik op "Verwijderen" bij vraag 2, verifieer dat een Supabase delete call gedaan wordt en de vraag uit de lijst verdwijnt
- [ ] **T14.5** `npm run build` slaagt zonder TypeScript errors
- [ ] **T14.6** Handmatige end-to-end test: upload een studiemateriaal PDF, wacht op embedding, specificeer 3 vragen op Bloom-niveau "begrijpen", bekijk gegenereerde vragen, accepteer 2 en verwijder 1, exporteer als CSV

---

### 15. Python Sidecar Docker & Deployment

- [ ] **15.1** Schrijf `sidecar/Dockerfile` (zie TDD sectie 9.3): Python 3.12-slim, install requirements, expose 8000, uvicorn CMD
- [ ] **15.2** Maak `sidecar/.env.example` met alle vereiste env vars
- [ ] **15.3** Test Docker build: `docker build -t mc-sidecar ./sidecar`
- [ ] **15.4** Test Docker run: `docker run -p 8000:8000 --env-file .env mc-sidecar` → healthcheck werkt
- [ ] **15.5** Deploy naar gekozen platform (Fly.io / Railway / Cloud Run) — configureer env vars daar
- [ ] **15.6** Update Supabase Edge Functions met de productie sidecar URL als secret

#### Tests taak 15

- [ ] **T15.1** `docker build` slaagt zonder errors
- [ ] **T15.2** Container draait en `/health` retourneert `{"status": "ok"}`
- [ ] **T15.3** Productie sidecar is bereikbaar: `curl https://<sidecar-url>/health` retourneert 200
- [ ] **T15.4** End-to-end: trigger analyse via de live site → sidecar verwerkt de vragen → resultaten verschijnen in het dashboard
