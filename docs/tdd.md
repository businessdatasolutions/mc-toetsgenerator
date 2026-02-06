# Technical Design — MC Toetsvalidatie & Generatie Platform

**Versie:** 1.0
**Datum:** Februari 2026
**Bron:** PRD v1.1

---

## 1 · Overzicht

Dit document vertaalt de PRD naar een implementeerbaar technisch ontwerp. Het beschrijft de architectuur, componentstructuur, datastromen, API-contracten en deployment-configuratie.

### Systeemoverzicht

```
┌──────────────────────────────────────────────────────────────┐
│  GitHub Pages                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Vite + React SPA                                      │  │
│  │  React Router · Tailwind CSS · @supabase/supabase-js   │  │
│  └──────────┬──────────────────────────┬──────────────────┘  │
└─────────────┼──────────────────────────┼─────────────────────┘
              │ HTTPS                    │ WSS (Realtime)
┌─────────────┼──────────────────────────┼─────────────────────┐
│  Supabase Cloud (EU)                   │                      │
│  ┌──────────┴──────────┐  ┌────────────┴──────────┐          │
│  │  PostgREST (auto)   │  │  Realtime Server      │          │
│  │  CRUD via SDK + RLS │  │  Postgres Changes      │          │
│  └──────────┬──────────┘  └───────────────────────┘          │
│             │                                                 │
│  ┌──────────┴──────────────────────────────────────────────┐ │
│  │  Edge Functions (Deno)                                   │ │
│  │  /analyze · /generate · /embed-material · /export        │ │
│  └──────────┬──────────────────────────────────────────────┘ │
│             │ HTTP                                            │
│  ┌──────────┴──────────────────────────────────────────────┐ │
│  │  PostgreSQL + pgvector                                   │ │
│  │  exams · questions · assessments · materials · chunks    │ │
│  └─────────────────────────────────────────────────────────┘ │
│  ┌──────────────────────┐  ┌──────────────────────┐          │
│  │  Supabase Storage    │  │  Supabase Auth       │          │
│  │  uploads/ exports/   │  │  SAML/OIDC SSO       │          │
│  └──────────────────────┘  └──────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
              │ HTTP (intern of extern)
┌─────────────┴────────────────────────────────────────────────┐
│  Python Sidecar (FastAPI)                                     │
│  ┌───────────────────┐  ┌──────────────────────────────────┐ │
│  │  Deterministic     │  │  LLM Orchestrator               │ │
│  │  Analyzer          │  │  Claude API · Prompt Management  │ │
│  └───────────────────┘  └──────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────────────────┐│
│  │  RAG Pipeline                                             ││
│  │  Chunking · Embedding · Retrieval · Generation            ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
```

---

## 2 · Frontend Architectuur

### 2.1 Technologiekeuzes

| Onderdeel | Keuze | Versie |
|-----------|-------|--------|
| Build tool | Vite | 6.x |
| Framework | React | 19.x |
| Taal | TypeScript | 5.x |
| Routing | React Router | 7.x |
| Styling | Tailwind CSS | 4.x |
| Supabase client | @supabase/supabase-js | 2.x |
| Hosting | GitHub Pages | — |

### 2.2 Projectstructuur

```
src/
├── main.tsx                    # Entrypoint, RouterProvider
├── App.tsx                     # Root layout (nav, auth guard)
├── index.css                   # Tailwind import
│
├── lib/
│   ├── supabase.ts             # createClient met env vars
│   ├── api.ts                  # Wrapper voor Edge Function calls
│   └── types.ts                # Gedeelde TypeScript types (Exam, Question, Assessment, ...)
│
├── routes/
│   ├── Home.tsx                # Landing / dashboard overzicht
│   ├── ExamUpload.tsx          # Flow A stap 1: upload CSV/Excel/DOCX
│   ├── ExamParsing.tsx         # Flow A stap 2: preview & correctie parsed vragen
│   ├── ExamDashboard.tsx       # Flow A stap 4: scores, heatmap, filters
│   ├── QuestionDetail.tsx      # Flow A stap 4-5: detail per vraag + suggesties
│   ├── MaterialUpload.tsx      # Flow B stap 1: upload studiemateriaal
│   ├── GenerateSpec.tsx        # Flow B stap 2: specificatie (Bloom, aantal, leerdoel)
│   ├── GenerateReview.tsx      # Flow B stap 5: review gegenereerde vragen
│   └── Export.tsx              # Export configuratie en download
│
├── components/
│   ├── ScoreBadge.tsx          # Kleurgecodeerde score badge (1-5 → rood/geel/groen)
│   ├── RadarChart.tsx          # Driehoekig radardiagram (B/T/V)
│   ├── Heatmap.tsx             # Matrix vraag × dimensie
│   ├── BloomBadge.tsx          # Bloom-niveau label met kleur
│   ├── QuestionCard.tsx        # Compact kaartje per vraag in overzicht
│   ├── QuestionEditor.tsx      # Inline editor voor stam + opties
│   ├── FileUploader.tsx        # Drag-and-drop upload component
│   └── Layout/
│       ├── Navbar.tsx
│       ├── Sidebar.tsx
│       └── ProtectedRoute.tsx  # Auth guard wrapper
│
├── hooks/
│   ├── useAuth.ts              # Supabase auth state
│   ├── useExam.ts              # Exam CRUD + realtime subscription
│   ├── useQuestions.ts         # Questions query met assessment joins
│   └── useAnalysis.ts         # Polling/realtime voor analyse-status
│
└── context/
    └── AuthContext.tsx          # Supabase session provider
```

### 2.3 Routing

```tsx
// React Router v7 route configuratie
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,               // Layout met nav + auth guard
    children: [
      { index: true, element: <Home /> },
      { path: "exams/upload", element: <ExamUpload /> },
      { path: "exams/:examId/parse", element: <ExamParsing /> },
      { path: "exams/:examId", element: <ExamDashboard /> },
      { path: "exams/:examId/questions/:questionId", element: <QuestionDetail /> },
      { path: "exams/:examId/export", element: <Export /> },
      { path: "materials/upload", element: <MaterialUpload /> },
      { path: "generate", element: <GenerateSpec /> },
      { path: "generate/:jobId/review", element: <GenerateReview /> },
    ],
  },
], { basename: "/mc-toetsgenerator" })  // GitHub Pages base path
```

### 2.4 Environment variabelen

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SIDECAR_URL=https://<sidecar-host>   # Python FastAPI sidecar (optioneel, kan ook via Edge Fn)
```

### 2.5 Supabase Client

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'  // gegenereerd via supabase gen types

export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

### 2.6 State management

Geen globale state library. Data wordt beheerd via:

1. **Supabase SDK queries** in custom hooks (met React Query of SWR als caching layer)
2. **Supabase Realtime subscriptions** voor live updates tijdens analyse
3. **React Context** uitsluitend voor auth-sessie
4. **URL state** via React Router params en search params voor filters/sortering

---

## 3 · Database Ontwerp

### 3.1 Schema

Volledig schema met constraints, indexes en RLS-policies.

```sql
-- Extensies
create extension if not exists "pgvector" with schema extensions;
create extension if not exists "pg_net" with schema extensions;

-- Enums
create type bloom_level as enum ('onthouden', 'begrijpen', 'toepassen', 'analyseren');
create type question_source as enum ('manual', 'generated', 'imported');
create type analysis_status as enum ('pending', 'processing', 'completed', 'failed');
create type discriminatie_level as enum ('hoog', 'gemiddeld', 'laag', 'geen');
create type ambiguiteit_level as enum ('geen', 'licht', 'hoog');

-- Exams
create table exams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  course text,
  created_by uuid not null references auth.users(id) on delete cascade,
  learning_goals text[] default '{}',
  analysis_status analysis_status default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_exams_created_by on exams(created_by);

-- Questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  position int not null,                           -- volgorde in toets
  stem text not null,
  options jsonb not null,                          -- [{text, position, is_correct}]
  correct_option int not null,                     -- 0-indexed positie
  bloom_level bloom_level,
  learning_goal text,
  version int not null default 1,
  source question_source not null default 'imported',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  constraint valid_options check (jsonb_array_length(options) >= 2)
);

create index idx_questions_exam_id on questions(exam_id);

-- Assessments (één per vraag per versie)
create table assessments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  question_version int not null,

  -- Deterministisch (tech_kwant_*)
  tech_kwant_longest_bias boolean,
  tech_kwant_homogeneity_score float,              -- 0.0–1.0
  tech_kwant_absolute_terms_correct text[] default '{}',
  tech_kwant_absolute_terms_distractors text[] default '{}',
  tech_kwant_negation_detected boolean,
  tech_kwant_negation_emphasized boolean,
  tech_kwant_flags text[] default '{}',

  -- AI Betrouwbaarheid
  bet_discriminatie discriminatie_level,
  bet_ambiguiteit ambiguiteit_level,
  bet_score smallint check (bet_score between 1 and 5),
  bet_toelichting text,

  -- AI Technisch Kwalitatief
  tech_kwal_stam_score smallint check (tech_kwal_stam_score between 1 and 5),
  tech_kwal_afleiders_score smallint check (tech_kwal_afleiders_score between 1 and 5),
  tech_kwal_score smallint check (tech_kwal_score between 1 and 5),
  tech_problemen text[] default '{}',
  tech_toelichting text,

  -- AI Validiteit
  val_cognitief_niveau bloom_level,
  val_score smallint check (val_score between 1 and 5),
  val_toelichting text,

  -- Verbetervoorstellen
  improvement_suggestions jsonb default '[]',      -- [{dimensie, suggestie, prioriteit}]

  created_at timestamptz default now(),

  constraint unique_question_version unique (question_id, question_version)
);

create index idx_assessments_question_id on assessments(question_id);

-- Materials (studiemateriaal voor RAG)
create table materials (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references auth.users(id),
  exam_id uuid references exams(id) on delete set null,
  filename text not null,
  mime_type text not null,
  storage_path text not null,                      -- pad in Supabase Storage
  content_text text,                               -- geëxtraheerde platte tekst
  chunk_count int default 0,
  created_at timestamptz default now()
);

-- Chunks (voor RAG retrieval)
create table chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  text text not null,
  embedding vector(768),                           -- multilingual-e5-base (768 dimensies)
  page int,
  position int not null,                           -- volgorde binnen materiaal
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_chunks_material_id on chunks(material_id);
create index idx_chunks_embedding on chunks
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Generation jobs (asynchroon)
create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  material_id uuid references materials(id),
  exam_id uuid references exams(id),
  specification jsonb not null,                    -- {count, bloom_level, learning_goal, num_options}
  status analysis_status default 'pending',
  result_question_ids uuid[] default '{}',
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);
```

### 3.2 Row Level Security

```sql
-- Exams: gebruiker ziet alleen eigen toetsen
alter table exams enable row level security;

create policy "Users can CRUD own exams"
  on exams for all
  using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Questions: via exam ownership
alter table questions enable row level security;

create policy "Users can access questions of own exams"
  on questions for all
  using (exam_id in (select id from exams where created_by = auth.uid()))
  with check (exam_id in (select id from exams where created_by = auth.uid()));

-- Assessments: via question → exam ownership
alter table assessments enable row level security;

create policy "Users can read assessments of own questions"
  on assessments for select
  using (
    question_id in (
      select q.id from questions q
      join exams e on q.exam_id = e.id
      where e.created_by = auth.uid()
    )
  );

-- Service role (Edge Functions) kan alles schrijven in assessments
create policy "Service can write assessments"
  on assessments for insert
  using (auth.role() = 'service_role');

-- Materials: gebruiker ziet eigen uploads
alter table materials enable row level security;

create policy "Users can CRUD own materials"
  on materials for all
  using (auth.uid() = uploaded_by)
  with check (auth.uid() = uploaded_by);

-- Chunks: via material ownership
alter table chunks enable row level security;

create policy "Users can read chunks of own materials"
  on chunks for select
  using (
    material_id in (select id from materials where uploaded_by = auth.uid())
  );
```

### 3.3 Database functies

```sql
-- Vector similarity search voor RAG
create or replace function match_chunks(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_material_id uuid default null
) returns table (
  id uuid,
  text text,
  page int,
  similarity float
) language sql stable as $$
  select c.id, c.text, c.page,
    1 - (c.embedding <=> query_embedding) as similarity
  from chunks c
  where 1 - (c.embedding <=> query_embedding) > match_threshold
    and (filter_material_id is null or c.material_id = filter_material_id)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- Geaggregeerde scores per exam
create or replace function exam_score_summary(p_exam_id uuid)
returns table (
  total_questions int,
  avg_bet_score numeric,
  avg_tech_score numeric,
  avg_val_score numeric,
  count_critical int           -- vragen met minstens één dimensie ≤ 2
) language sql stable as $$
  select
    count(distinct q.id)::int,
    round(avg(a.bet_score), 1),
    round(avg(a.tech_kwal_score), 1),
    round(avg(a.val_score), 1),
    count(distinct q.id) filter (
      where a.bet_score <= 2 or a.tech_kwal_score <= 2 or a.val_score <= 2
    )::int
  from questions q
  join assessments a on a.question_id = q.id and a.question_version = q.version
  where q.exam_id = p_exam_id;
$$;
```

---

## 4 · API Ontwerp

### 4.1 Client SDK Operaties (directe Supabase calls met RLS)

| Operatie | Pattern | Beschrijving |
|----------|---------|--------------|
| Toets aanmaken | `supabase.from('exams').insert({...})` | Nieuwe toets, `created_by` automatisch via RLS |
| Vragen ophalen | `supabase.from('questions').select('*, assessments(*)').eq('exam_id', id)` | Vragen met meest recente assessment |
| Vraag updaten | `supabase.from('questions').update({stem, options, version}).eq('id', id)` | Increment version bij wijziging |
| Materiaal metadata | `supabase.from('materials').select(...)` | Lijst van uploads |
| Bestand uploaden | `supabase.storage.from('uploads').upload(path, file)` | Upload naar Supabase Storage bucket |

### 4.2 Edge Functions (server-side processing)

Alle Edge Functions draaien in Deno, gebruiken `supabase-js` met service role key, en communiceren met de Python sidecar via HTTP.

#### `POST /functions/v1/analyze`

Start de volledige validatiepipeline voor een toets.

```typescript
// Request
{
  exam_id: string  // UUID
}

// Response
{
  job_id: string,
  status: "processing",
  question_count: number
}

// Flow:
// 1. Haal alle vragen op voor exam_id
// 2. Stuur naar Python sidecar: POST /analyze
// 3. Sidecar draait deterministische analyse + LLM validatie
// 4. Sidecar schrijft assessments terug naar Supabase (service role)
// 5. Update exams.analysis_status → 'completed'
// 6. Frontend ontvangt update via Realtime subscription
```

#### `POST /functions/v1/generate`

Start vraaggerneratie op basis van studiemateriaal.

```typescript
// Request
{
  material_id: string,
  exam_id?: string,            // optioneel: toevoegen aan bestaande toets
  specification: {
    count: number,             // aantal te genereren vragen
    bloom_level: string,       // 'onthouden' | 'begrijpen' | 'toepassen' | 'analyseren'
    learning_goal: string,
    num_options: number,       // 3 of 4
    language: "nl"
  }
}

// Response
{
  job_id: string,
  status: "processing"
}

// Flow:
// 1. Haal materiaal chunks op via match_chunks()
// 2. Stuur naar Python sidecar: POST /generate
// 3. Sidecar genereert vragen via RAG + LLM
// 4. Sidecar schrijft vragen + assessments naar Supabase
// 5. Update generation_jobs.status → 'completed'
```

#### `POST /functions/v1/embed-material`

Verwerk geüpload studiemateriaal: tekst extractie, chunking, embedding.

```typescript
// Request
{
  material_id: string
}

// Response
{
  status: "processing",
  filename: string
}

// Flow:
// 1. Download bestand uit Supabase Storage
// 2. Stuur naar Python sidecar: POST /embed
// 3. Sidecar: extractie → chunking → embedding → opslaan in chunks tabel
// 4. Update materials.chunk_count
```

#### `GET /functions/v1/export/{format}`

Genereer export van toetsresultaten.

```typescript
// Query params
{
  exam_id: string,
  format: "csv" | "pdf" | "markdown"
}

// Response: binary file download
// Content-Type afhankelijk van format
```

### 4.3 Python Sidecar API (FastAPI)

De sidecar draait als aparte service en is alleen bereikbaar via Edge Functions (niet direct vanuit de frontend).

```
POST /analyze        → Deterministische analyse + LLM validatie
POST /generate       → RAG retrieval + LLM vraaggerneratie
POST /embed          → Tekst extractie + chunking + embedding
GET  /health         → Healthcheck
```

---

## 5 · Python Sidecar — Processing Pipeline

### 5.1 Projectstructuur

```
sidecar/
├── main.py                         # FastAPI app, routes
├── requirements.txt
├── Dockerfile
│
├── config/
│   └── settings.py                 # Pydantic Settings (env vars)
│
├── analyzers/
│   ├── deterministic.py            # Regelgebaseerde checks (tech_kwant_*)
│   └── schemas.py                  # Pydantic models voor deterministic output
│
├── llm/
│   ├── client.py                   # Anthropic SDK wrapper
│   ├── prompts/
│   │   ├── validation.py           # Prompt-builder voor validatie
│   │   └── generation.py           # Prompt-builder voor generatie
│   └── schemas.py                  # Pydantic models als schema-definitie voor structured output
│
├── rag/
│   ├── extractor.py                # PDF/DOCX → platte tekst
│   ├── chunker.py                  # Tekst → chunks (~500 tokens, 50 overlap)
│   ├── embedder.py                 # Chunks → vector embeddings
│   └── retriever.py                # Vector search via Supabase RPC
│
├── services/
│   ├── validation_pipeline.py      # Orchestratie: deterministic → LLM → assessment
│   ├── generation_pipeline.py      # Orchestratie: retrieve → generate → validate
│   └── supabase_client.py          # Supabase client (service role)
│
└── criteria/                       # Symlink of copy van docs/criteria-*.md
    ├── betrouwbaarheid.md
    ├── technisch.md
    └── validiteit.md
```

### 5.2 Deterministische Analyzer

```python
# analyzers/deterministic.py

@dataclass
class DeterministicResult:
    tech_kwant_longest_bias: bool
    tech_kwant_homogeneity_score: float       # 0.0–1.0
    tech_kwant_absolute_terms_correct: list[str]
    tech_kwant_absolute_terms_distractors: list[str]
    tech_kwant_negation_detected: bool
    tech_kwant_negation_emphasized: bool
    tech_kwant_flags: list[str]

def analyze(question: Question) -> DeterministicResult:
    """
    Regelgebaseerde checks. Altijd identieke output voor dezelfde input.

    Checks:
    1. Langste-antwoord-bias: correct antwoord >50% langer dan gemiddelde afleider
    2. Homogeniteit: standaarddeviatie van antwoordlengtes, genormaliseerd 0-1.
       Uitzondering: bij korte antwoorden (1-2 woorden) wordt een hogere tolerantie
       gehanteerd — kleine absolute lengteverschillen zijn dan onvermijdelijk.
    3. Absolute termen: scan op 'altijd', 'nooit', 'alle', 'geen', 'elke', 'iedere'
    4. Ontkenning: detectie van 'niet', 'geen', 'behalve', 'uitgezonderd' in stam
    5. Ontkenning benadrukt: hoofdletters of markdown bold
    """
```

**Absolute termen woordenlijst (Nederlands):**
`altijd`, `nooit`, `alle`, `geen`, `elke`, `iedere`, `uitsluitend`, `alleen`, `volledig`, `absoluut`, `zonder uitzondering`

### 5.3 LLM Orchestrator

```python
# llm/client.py

class LLMClient:
    def __init__(self):
        self.client = anthropic.Anthropic()
        self.model_standard = "claude-sonnet-4-5-20241022"
        self.model_fallback = "claude-opus-4-5-20250514"

    async def validate_question(
        self,
        question: Question,
        deterministic_results: DeterministicResult,
        criteria: dict[str, str],                      # criteria markdown content
    ) -> ValidationResult:
        """
        Valideer één vraag op 3 dimensies.
        Temperature: 0.0

        Gebruikt client.messages.parse() met Pydantic model als output_format.
        De API garandeert JSON dat voldoet aan het schema (constrained decoding).
        Geen retry-logica nodig voor schema-validatie.
        """
        messages = build_validation_prompt(question, deterministic_results, criteria)
        response = self.client.messages.parse(
            model=self.model_standard,
            max_tokens=2048,
            temperature=0.0,
            system=messages[0]["content"],
            messages=[messages[1]],
            output_format=ValidationResult,
        )
        return response.parsed_output

    async def generate_questions(
        self,
        specification: GenerationSpec,
        chunks: list[Chunk],
        criteria: dict[str, str],
    ) -> list[GeneratedQuestion]:
        """
        Genereer MC-vragen op basis van RAG chunks.
        Temperature: 0.4–0.7

        Gebruikt client.messages.parse() met Pydantic wrapper model.
        """
        messages = build_generation_prompt(specification, chunks, criteria)
        response = self.client.messages.parse(
            model=self.model_standard,
            max_tokens=4096,
            temperature=0.5,
            system=messages[0]["content"],
            messages=[messages[1]],
            output_format=GenerationResult,
        )
        return response.parsed_output.questions
```

### 5.4 Prompt-opbouw

De prompts worden programmatisch opgebouwd uit vier lagen (zie PRD sectie 10). Het output-schema wordt niet meer in de prompt meegegeven — dat regelt `client.messages.parse()` via `output_config.format` (constrained decoding).

```python
# llm/prompts/validation.py

def build_validation_prompt(
    question: Question,
    deterministic: DeterministicResult,
    criteria_bet: str,           # inhoud criteria-betrouwbaarheid.md
    criteria_tech: str,          # inhoud criteria-technisch.md
    criteria_val: str,           # inhoud criteria-validiteit.md
) -> list[dict]:
    return [
        {
            "role": "system",
            "content": SYSTEM_PROMPT_VALIDATION   # laag 1
        },
        {
            "role": "user",
            "content": f"""
<criteria_betrouwbaarheid>
{criteria_bet}
</criteria_betrouwbaarheid>

<criteria_technisch>
{criteria_tech}
</criteria_technisch>

<criteria_validiteit>
{criteria_val}
</criteria_validiteit>

<deterministic_results>
{json.dumps(asdict(deterministic), ensure_ascii=False)}
</deterministic_results>

<question>
stam: {question.stem}
opties: {format_options(question.options)}
correct: {question.correct_option}
leerdoel: {question.learning_goal or "niet opgegeven"}
</question>
"""
        }
    ]
```

### 5.5 Structured Output Schema's (Pydantic)

De Pydantic models dienen als **schema-definitie** voor Claude's structured output. De Anthropic SDK transformeert ze automatisch naar JSON Schema en garandeert via constrained decoding dat de response exact voldoet aan het schema. Er is geen handmatige JSON-parsing of retry-logica nodig.

> **Let op:** Constraints als `ge=`, `le=`, `max_length=` worden door de SDK omgezet naar schema-beschrijvingen (descriptions). De API valideert structuur (types, required fields, enums) gegarandeerd; numerieke ranges worden via de prompt afgedwongen en door de SDK gevalideerd na ontvangst.

```python
# llm/schemas.py
from pydantic import BaseModel, Field
from typing import Literal

class ImprovementSuggestion(BaseModel):
    dimensie: Literal["betrouwbaarheid", "technisch", "validiteit"]
    suggestie: str
    prioriteit: Literal["hoog", "gemiddeld", "laag"]

class ValidationResult(BaseModel):
    """Schema voor client.messages.parse(output_format=ValidationResult)"""

    # Betrouwbaarheid
    bet_discriminatie: Literal["hoog", "gemiddeld", "laag", "geen"]
    bet_ambiguiteit: Literal["geen", "licht", "hoog"]
    bet_score: int = Field(ge=1, le=5)
    bet_toelichting: str = Field(max_length=200)

    # Technisch kwalitatief
    tech_kwal_stam_score: int = Field(ge=1, le=5)
    tech_kwal_afleiders_score: int = Field(ge=1, le=5)
    tech_kwal_score: int = Field(ge=1, le=5)
    tech_problemen: list[str]
    tech_toelichting: str = Field(max_length=200)

    # Validiteit
    val_cognitief_niveau: Literal["onthouden", "begrijpen", "toepassen", "analyseren"]
    val_score: int = Field(ge=1, le=5)
    val_toelichting: str = Field(max_length=200)

    # Verbetervoorstellen
    improvement_suggestions: list[ImprovementSuggestion]

class QuestionOption(BaseModel):
    text: str
    position: int
    is_correct: bool

class GeneratedQuestion(BaseModel):
    stem: str
    options: list[QuestionOption]
    correct_option: int
    bloom_level: Literal["onthouden", "begrijpen", "toepassen", "analyseren"]
    source_chunk_ids: list[str]                    # traceerbaarheid naar bronmateriaal
    rationale: str                                  # waarom deze vraag bij het leerdoel past

class GenerationResult(BaseModel):
    """Wrapper model — parse() vereist een enkel top-level object."""
    questions: list[GeneratedQuestion]
```

### 5.6 RAG Pipeline

```python
# rag/chunker.py

CHUNK_SIZE = 500          # tokens (geschat via tiktoken of karakter-heuristiek)
CHUNK_OVERLAP = 50        # tokens overlap tussen opeenvolgende chunks

def chunk_text(text: str, metadata: dict) -> list[Chunk]:
    """
    Splits tekst in chunks met overlap.
    Respecteert paragraafgrenzen waar mogelijk.
    Voegt pagina-informatie toe indien beschikbaar.
    """

# rag/embedder.py

async def embed_chunks(chunks: list[Chunk]) -> list[list[float]]:
    """
    In-container embedding via sentence-transformers.
    Model: intfloat/multilingual-e5-base (768 dimensies)
    Batch size: 100 chunks per call
    """
```

### 5.7 Validatie Pipeline Orchestratie

```python
# services/validation_pipeline.py

async def run_validation(exam_id: str):
    """
    Volledige validatiepipeline voor alle vragen in een toets.

    1. Haal vragen op uit Supabase
    2. Per vraag: deterministische analyse
    3. Per vraag: LLM validatie (concurrent, max 5 parallel)
    4. Schrijf assessments naar Supabase
    5. Update exam status → 'completed'

    Bij fouten:
    - Schema-validatie is gegarandeerd door structured output (geen retries nodig)
    - Bij stop_reason 'refusal' of 'max_tokens': log en markeer vraag als failed, ga door
    - Bij API-fouten (rate limit, timeout): retry met exponential backoff (max 2x)
    - Update exam status → 'completed' (met partial results) of 'failed'
    """
```

---

## 6 · Bestandsverwerking

### 6.1 Upload Parsing

Ondersteunde formaten voor vraagimport:

| Formaat | Parser | Verwacht formaat |
|---------|--------|------------------|
| CSV | Python `csv` | Kolommen: `stam`, `optie_a`, `optie_b`, `optie_c`, `optie_d`, `correct` |
| Excel (.xlsx) | `openpyxl` | Zelfde kolomstructuur als CSV |
| DOCX | `python-docx` | Genummerde vragen met A/B/C/D opties, correcte antwoord aangeduid |

De parser levert een preview die de gebruiker kan controleren en corrigeren voordat analyse start.

### 6.2 Materiaal Extractie (voor RAG)

| Formaat | Extractor | Output |
|---------|-----------|--------|
| PDF | `pdfplumber` of `pymupdf` | Platte tekst per pagina met pagina-metadata |
| DOCX | `python-docx` | Platte tekst met koppen als structuur |
| Platte tekst | Direct | Directe chunking |

### 6.3 Export Generatie

| Formaat | Library | Inhoud |
|---------|---------|--------|
| CSV | Python `csv` | Eén rij per vraag, alle scores + deterministic flags |
| PDF | `weasyprint` of `reportlab` | Geformateerd rapport met grafieken en kleurcodes |
| Markdown | Template string | Gestructureerd rapport, geschikt voor versiebeheer |

---

## 7 · Authenticatie & Autorisatie

### 7.1 Auth Flow

```
┌─────────┐     ┌───────────────┐     ┌──────────────────┐
│ Frontend │────▶│ Supabase Auth │────▶│ Institutionele   │
│ (SPA)    │◀────│ PKCE flow     │◀────│ IdP (SAML/OIDC)  │
└─────────┘     └───────────────┘     └──────────────────┘
```

- **Protocol:** PKCE (Proof Key for Code Exchange) — veilig voor SPA's zonder server-side secret
- **SSO:** SAML of OIDC koppeling met institutionele Identity Provider
- **Token opslag:** `supabase-js` beheert tokens automatisch in localStorage
- **Sessie refresh:** Automatisch via `supabase.auth.onAuthStateChange()`

### 7.2 Autorisatiemodel

MVP werkt met één rol (docent). Uitbreiding naar meerdere rollen via Supabase custom claims:

| Rol | Rechten |
|-----|---------|
| `docent` | CRUD eigen toetsen, eigen materialen, eigen analyses |
| `reviewer` | Leestoegang tot toetsen binnen eigen opleiding (fase 3) |
| `admin` | Systeemconfiguratie, gebruikersbeheer (fase 3) |

---

## 8 · Async Processing & Realtime Updates

### 8.1 Flow

Langlopende operaties (analyse, generatie, embedding) draaien asynchroon:

```
Frontend                    Edge Function               Python Sidecar
   │                            │                            │
   │  POST /analyze             │                            │
   │ ──────────────────────────▶│                            │
   │  { job_id, "processing" }  │                            │
   │ ◀──────────────────────────│  POST /analyze             │
   │                            │ ──────────────────────────▶│
   │                            │                            │ (processing...)
   │  Realtime subscription     │                            │
   │  on exams.analysis_status  │                            │
   │ ◀ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│  UPDATE exams SET status   │
   │                            │ ◀──────────────────────────│
   │  "completed" ──▶ refetch   │                            │
```

### 8.2 Supabase Realtime

```typescript
// Frontend: luisteren naar analyse-updates
supabase
  .channel('exam-status')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'exams',
    filter: `id=eq.${examId}`,
  }, (payload) => {
    if (payload.new.analysis_status === 'completed') {
      refetchQuestions()
    }
  })
  .subscribe()
```

---

## 9 · Deployment

### 9.1 Frontend — GitHub Pages

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

**Vite configuratie voor GitHub Pages:**

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/mc-toetsgenerator/',
})
```

**SPA routing op GitHub Pages** vereist een `404.html` redirect trick:

```html
<!-- public/404.html — redirect alle routes naar index.html -->
<!DOCTYPE html>
<html>
  <head>
    <script>
      // Redirect naar index.html met path als query param
      const path = window.location.pathname
      window.location.replace(
        window.location.origin + '/mc-toetsgenerator/?redirect=' + encodeURIComponent(path)
      )
    </script>
  </head>
</html>
```

### 9.2 Supabase

- **Project:** Supabase Cloud, EU-regio (Frankfurt of Amsterdam)
- **Migraties:** Via `supabase db push` of `supabase migration` CLI
- **Edge Functions:** Deploy via `supabase functions deploy`
- **Secrets:** `supabase secrets set ANTHROPIC_API_KEY=...`

### 9.3 Python Sidecar

**Gekozen platform:** Google Cloud Run (europe-west1)

- **URL:** `https://mc-sidecar-990894571821.europe-west1.run.app`
- **Specs:** 2 GB RAM, 2 vCPU (nodig voor in-container embedding model)
- **Scaling:** 0–3 instances (scale-to-zero)
- **Deploy:** `gcloud run deploy mc-sidecar --source ./sidecar --region europe-west1`

Dockerfile:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc && \
    rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

## 10 · Foutafhandeling & Monitoring

### 10.1 Error handling strategie

| Laag | Strategie |
|------|-----------|
| Frontend | Toast notificaties bij API-fouten, retry-button bij analyse-failures |
| Edge Functions | Structured error responses `{error: string, code: string}`, logging naar Supabase logs |
| Python Sidecar | Per-vraag error catching, partial results bij gedeeltelijk falen |
| LLM calls | Structured output via `output_config.format` garandeert valide JSON; fallback naar Opus bij `stop_reason: "refusal"` of `"max_tokens"` |

### 10.2 Monitoring

| Wat | Hoe |
|-----|-----|
| API-kosten LLM | Token-tellingen loggen per assessment, dagelijks budget-check |
| LLM-consistentie | Periodiek dezelfde referentievragen valideren, drift detectie |
| Error rates | Supabase Dashboard logs + Edge Function metrics |
| Latency | Timings loggen per pipeline-stap (deterministic, LLM, totaal) |

---

## 11 · Fasering Implementatie

### Fase 1 — MVP Validatie

| Sprint | Deliverables | Componenten |
|--------|-------------|-------------|
| 1-2 | Infra + data | Supabase project, DB schema + migraties, RLS policies, Vite project scaffold, auth flow, upload parsing |
| 3-4 | AI pipeline | Python sidecar, deterministic analyzer, LLM validation met structured output, prompt templates |
| 5-6 | Dashboard | ExamDashboard, QuestionDetail, ScoreBadge, RadarChart, Heatmap, filters/sortering |
| 7-8 | Export + polish | CSV/PDF/Markdown export, SSO configuratie, error handling, bugfixes |
| 9-10 | Pilot | Deploy, pilot met 3-5 docenten, iteratie op feedback |

### Fase 2 — Generatie

| Sprint | Deliverables |
|--------|-------------|
| 11-12 | RAG pipeline: materiaal upload, extractie, chunking, embedding |
| 13-14 | Generatie engine: prompt-builder, inline validatie, GenerateReview UI |
| 15-16 | Verfijning: iteratief aanpassen, versiegeschiedenis, toetsmatrijs |
| 17-18 | Pilot + tuning |

---

*Technical Design v1.0 — MC Toetsvalidatie & Generatie Platform — Februari 2026*
