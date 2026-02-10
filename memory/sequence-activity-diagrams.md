# Sequence & Activity Diagrams — MC Toetsvalidatie & Generatie Platform

---

## Module A: Validation

### Sequence: Exam Upload, Parse & Analyze

```mermaid
sequenceDiagram
    actor Educator
    participant SPA as React SPA
    participant Storage as Supabase Storage
    participant DB as PostgreSQL
    participant Edge as Edge Function<br/>(analyze)
    participant Sidecar as Python Sidecar
    participant Claude as Claude API<br/>(Haiku 4.5)

    Note over Educator,SPA: 1. Upload exam file
    Educator->>SPA: Submit exam form (title, course, file)
    SPA->>DB: INSERT exams (title, course, created_by)
    DB-->>SPA: exam.id
    SPA->>Storage: Upload file to uploads/{examId}/{filename}
    SPA->>SPA: Navigate to /exams/{examId}/parse

    Note over Educator,Sidecar: 2. Parse file into questions
    SPA->>Storage: Download uploaded file
    Storage-->>SPA: File binary
    SPA->>Sidecar: POST /parse (file)
    Sidecar->>Sidecar: Detect format (CSV/XLSX/DOCX)
    Sidecar-->>SPA: ParsedQuestion[]

    Note over Educator,Sidecar: 3. Validate structure
    SPA->>Sidecar: POST /validate (questions)
    Sidecar-->>SPA: ValidationResponse (is_valid, errors)

    opt Validation fails — AI repair
        Educator->>SPA: Click AI Repair
        SPA->>Sidecar: POST /repair (questions, validation)
        Sidecar->>Claude: Repair prompt (tool_choice)
        Claude-->>Sidecar: RepairPlan (proposals)
        Sidecar-->>SPA: RepairPlan
        Educator->>SPA: Select and apply proposals
        SPA->>Sidecar: POST /validate (repaired questions)
        Sidecar-->>SPA: ValidationResponse (is_valid: true)
    end

    Note over Educator,Claude: 4. Save and trigger analysis
    Educator->>SPA: Click Opslaan en Analyseer
    SPA->>DB: INSERT questions (exam_id, stem, options, position)
    SPA->>Edge: POST /analyze {exam_id}
    Edge->>DB: Verify ownership (exams.created_by)
    Edge->>DB: UPDATE exams SET status='processing', question_count=N, questions_analyzed=0
    Edge->>Sidecar: POST /analyze {exam_id} (fire-and-forget)
    Edge-->>SPA: status: processing
    SPA->>SPA: Navigate to /exams/{examId} (dashboard)

    Note over Sidecar,Claude: 5. Background validation pipeline
    Sidecar->>DB: SELECT questions WHERE exam_id
    loop For each question (max 5 concurrent)
        Sidecar->>Sidecar: Deterministic analysis (rule-based flags)
        Sidecar->>Claude: Validation prompt + deterministic results (tool_choice, temp 0.0)
        Claude-->>Sidecar: ValidationResult (bet/tech/val scores)
        Sidecar->>DB: UPSERT assessments (question_id, question_version)
        Sidecar->>DB: RPC increment_questions_analyzed(exam_id)
    end
    Sidecar->>DB: UPDATE exams SET status='completed'

    Note over Educator,DB: 6. Dashboard receives live updates
    DB-->>SPA: Realtime: exam.questions_analyzed updated
    SPA->>SPA: Update progress bar
    DB-->>SPA: Realtime: exam.status = 'completed'
    SPA->>DB: RPC exam_score_summary(exam_id)
    DB-->>SPA: avg_bet_score, avg_tech_score, avg_val_score
    SPA->>DB: SELECT questions + assessments
    DB-->>SPA: Questions with scores
```

### Sequence: Single-Question Reassessment

```mermaid
sequenceDiagram
    actor Educator
    participant SPA as React SPA
    participant DB as PostgreSQL
    participant Edge as Edge Function<br/>(analyze)
    participant Sidecar as Python Sidecar
    participant Claude as Claude API

    Educator->>SPA: Click Herbeoordeling on question
    SPA->>Edge: POST /analyze {exam_id, question_id}
    Edge->>DB: Verify ownership
    Edge->>Sidecar: POST /analyze {exam_id, question_id}
    Edge-->>SPA: status: processing

    Sidecar->>DB: SELECT question WHERE id = question_id
    Sidecar->>Sidecar: Deterministic analysis
    Sidecar->>Claude: Validation prompt (tool_choice, temp 0.0)
    Claude-->>Sidecar: ValidationResult
    Sidecar->>DB: UPSERT assessments

    loop Poll every 2s (max 60s)
        SPA->>DB: SELECT assessments.assessed_at WHERE question_id
        alt New assessed_at detected
            SPA->>DB: SELECT questions + assessments (refetch)
            SPA->>DB: RPC exam_score_summary (refresh)
            SPA->>SPA: Update UI
        end
    end
```

### Activity: Validation Pipeline (per question)

```mermaid
flowchart TD
    A[Start: Question received] --> B[Extract stem, options, correct_index]

    B --> C[Layer 1: Deterministic Analysis]
    C --> C1{Longest answer bias?}
    C1 -->|Yes| C1a[Flag: langste-antwoord-bias]
    C1 -->|No| C2
    C1a --> C2{Low option homogeneity?}
    C2 -->|Yes| C2a[Flag: lage-homogeniteit-opties]
    C2 -->|No| C3
    C2a --> C3{Absolute terms in correct answer?}
    C3 -->|Yes| C3a[Flag: absolute-termen-correct]
    C3 -->|No| C4
    C3a --> C4{Absolute terms in distractors?}
    C4 -->|Yes| C4a[Flag: absolute-termen-afleiders]
    C4 -->|No| C5
    C4a --> C5{Negation in stem?}
    C5 -->|Yes| C5a{Negation emphasized?}
    C5 -->|No| D
    C5a -->|No| C5b[Flag: negatie-niet-benadrukt]
    C5a -->|Yes| D
    C5b --> D

    D[Layer 2: LLM Analysis via Claude Haiku 4.5]
    D --> D1[Build prompt with criteria markdown + deterministic results]
    D1 --> D2[Call Claude API — tool_choice, temp 0.0]
    D2 --> D3[Parse structured output: ValidationResult]

    D3 --> E1[Betrouwbaarheid: discriminatie, ambiguiteit → score 1-5]
    D3 --> E2[Technisch: stam_score, afleiders_score → score 1-5]
    D3 --> E3[Validiteit: cognitief_niveau, alignment → score 1-5]
    D3 --> E4[Improvement suggestions per dimension]

    E1 --> F[Merge deterministic + LLM results]
    E2 --> F
    E3 --> F
    E4 --> F

    F --> G[UPSERT assessment record]
    G --> H[Increment exam progress counter]
    H --> I[End]
```

---

## Module B: Generation

### Sequence: Material Upload & Embedding

```mermaid
sequenceDiagram
    actor Educator
    participant SPA as React SPA
    participant Storage as Supabase Storage
    participant DB as PostgreSQL
    participant Edge as Edge Function<br/>(embed-material)
    participant Sidecar as Python Sidecar

    Educator->>SPA: Select study material (PDF/DOCX/TXT)
    SPA->>Storage: Upload to materials/{uuid}/{filename}
    SPA->>DB: INSERT materials (filename, mime_type, storage_path, chunk_count=0)
    DB-->>SPA: material.id
    SPA->>Edge: POST /embed-material {material_id}
    Edge->>DB: Verify ownership (materials.uploaded_by)
    Edge->>Sidecar: POST /embed {material_id} (fire-and-forget)
    Edge-->>SPA: status: processing

    Note over Sidecar,Storage: Background embedding pipeline
    Sidecar->>DB: SELECT material (storage_path, mime_type)
    Sidecar->>Storage: Download file
    Storage-->>Sidecar: File binary
    Sidecar->>Sidecar: Extract text (pdfplumber / python-docx)
    Sidecar->>Sidecar: Chunk text (~500 tokens, 50 overlap)
    Sidecar->>Sidecar: Embed chunks (multilingual-e5-base, 768 dims)
    Sidecar->>DB: INSERT chunks (text, embedding, page, position)
    Sidecar->>DB: UPDATE materials SET chunk_count=N, content_text

    loop Poll every 3s
        SPA->>DB: SELECT materials.chunk_count WHERE id
        alt chunk_count > 0
            SPA->>SPA: Navigate to /generate (materialId preselected)
        end
    end
```

### Sequence: Question Generation (RAG)

```mermaid
sequenceDiagram
    actor Educator
    participant SPA as React SPA
    participant DB as PostgreSQL
    participant Edge as Edge Function<br/>(generate)
    participant Sidecar as Python Sidecar
    participant Embedder as Embedder<br/>(e5-base)
    participant pgvector as pgvector
    participant Claude as Claude API<br/>(Sonnet 4.5)

    Educator->>SPA: Submit generation spec (material, count, bloom, learning_goal)
    SPA->>Edge: POST /generate {material_id, specification}
    Edge->>DB: Verify material ownership
    Edge->>DB: INSERT generation_jobs (specification, status='pending')
    DB-->>Edge: job.id
    Edge->>Sidecar: POST /generate {job_id} (fire-and-forget)
    Edge-->>SPA: job_id, status: processing
    SPA->>SPA: Navigate to /generate/{jobId}/review

    Note over Sidecar,Claude: Background generation pipeline
    Sidecar->>DB: SELECT generation_jobs (specification, material_id)
    Sidecar->>DB: UPDATE generation_jobs SET status='processing'

    Note over Sidecar,pgvector: RAG retrieval
    Sidecar->>Embedder: embed_query(learning_goal) with query prefix
    Embedder-->>Sidecar: query_embedding (768 dims)
    Sidecar->>pgvector: RPC match_chunks(embedding, top_k=10, material_id)
    pgvector-->>Sidecar: Ranked chunks (cosine similarity)

    Note over Sidecar,Claude: Question generation
    Sidecar->>Claude: Generation prompt + chunks + spec (tool_choice, temp 0.5)
    Claude-->>Sidecar: GenerationResult (questions[])
    Sidecar->>DB: INSERT questions (stem, options, bloom_level, source='generated')
    DB-->>Sidecar: question IDs

    Note over Sidecar,Claude: Auto-validation of generated questions
    Sidecar->>Sidecar: run_validation(exam_id) — full pipeline
    Sidecar->>DB: UPDATE generation_jobs SET status='completed', result_question_ids

    loop Poll every 3s
        SPA->>DB: SELECT generation_jobs.status WHERE id
        alt status = 'completed'
            SPA->>DB: SELECT questions + assessments WHERE id IN result_ids
            DB-->>SPA: Generated questions with scores
        end
    end

    Educator->>SPA: Review, edit, delete generated questions
```

### Activity: RAG Embedding Pipeline

```mermaid
flowchart TD
    A[Start: material_id received] --> B[Fetch material record from DB]
    B --> C[Download file from Supabase Storage]
    C --> D{Detect MIME type}

    D -->|application/pdf| E1[Extract text per page — pdfplumber]
    D -->|application/docx| E2[Extract full text — python-docx]
    D -->|text/plain| E3[Read raw text]

    E1 --> F1[chunk_pages: split preserving page numbers]
    E2 --> F2[chunk_text: split on paragraph boundaries]
    E3 --> F2

    F1 --> G[Chunks ready ~500 tokens each, 50 token overlap]
    F2 --> G

    G --> H[Batch embed: multilingual-e5-base with 'passage: ' prefix]
    H --> I[768-dimensional vectors generated]

    I --> J[INSERT chunks into DB — text + embedding + page + position]
    J --> K[UPDATE materials — chunk_count, content_text]
    K --> L[End: Frontend detects chunk_count > 0]
```

### Activity: Question Generation Pipeline

```mermaid
flowchart TD
    A[Start: job_id received] --> B[Fetch generation_jobs record]
    B --> C[Update job status → processing]
    C --> D[Extract specification: count, bloom_level, learning_goal, num_options]

    D --> E[RAG Retrieval]
    E --> E1[Embed learning_goal with 'query: ' prefix]
    E1 --> E2[RPC match_chunks — cosine similarity, top_k=10]
    E2 --> E3{Chunks found?}
    E3 -->|No| ERR1[Update job status → failed]
    E3 -->|Yes| F

    F[Build generation prompt with specification + retrieved chunks + criteria]
    F --> G[Call Claude Sonnet 4.5 — tool_choice, temp 0.5]
    G --> H[Parse GenerationResult — list of questions]

    H --> I[Insert generated questions into DB]
    I --> J[Run full validation pipeline on generated questions]
    J --> K[Update job status → completed with result_question_ids]
    K --> L[End: Frontend detects job completion]

    ERR1 --> M[End: Frontend shows error]
```

---

## Export

### Sequence: Exam Export

```mermaid
sequenceDiagram
    actor Educator
    participant SPA as React SPA
    participant Edge as Edge Function<br/>(export)
    participant DB as PostgreSQL

    Educator->>SPA: Select export format (CSV / Markdown)
    SPA->>Edge: GET /export with exam_id, format + Bearer token
    Edge->>DB: Verify ownership (exams.created_by = auth.uid)
    Edge->>DB: SELECT questions + assessments WHERE exam_id ORDER BY position
    DB-->>Edge: Questions with assessment scores

    alt format = csv
        Edge->>Edge: Generate CSV (Nr, Stam, Correct, Bloom, B/T/V scores, Flags)
        Edge-->>SPA: Attachment download title.csv
    else format = markdown
        Edge->>Edge: Generate Markdown (overview table + per-question details)
        Edge-->>SPA: Attachment download title.md
    else format = pdf
        Edge-->>SPA: 501 Not Implemented
    end

    SPA->>SPA: Create blob URL → trigger browser download
    Educator->>Educator: File downloaded
```

---

## Authentication

### Sequence: Login & Protected Route Access

```mermaid
sequenceDiagram
    actor Educator
    participant SPA as React SPA
    participant Auth as Supabase Auth
    participant DB as PostgreSQL

    Educator->>SPA: Navigate to protected route
    SPA->>Auth: getSession()
    Auth-->>SPA: null (no session)
    SPA->>SPA: Redirect to /login

    Educator->>SPA: Enter email + password
    SPA->>Auth: signInWithPassword(email, password)
    Auth-->>SPA: Session {access_token, user}
    SPA->>SPA: AuthContext stores session
    SPA->>SPA: Redirect to / (home)

    Note over SPA,DB: All subsequent API calls
    SPA->>DB: Queries with RLS (auth.uid() from JWT)
    SPA->>Auth: onAuthStateChange listener (auto-refresh)
```
