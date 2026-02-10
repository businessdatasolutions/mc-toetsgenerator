# C4 Architecture Model — MC Toetsvalidatie & Generatie Platform

## Level 1: System Context

```mermaid
C4Context
    title System Context — MC Toetsvalidatie & Generatie Platform

    Person(educator, "Educator", "Uploads MC exam questions for validation or study materials for question generation")

    System(platform, "MC Toetsvalidatie Platform", "Validates and generates multiple-choice exam questions using deterministic rules and AI analysis")

    System_Ext(claude, "Anthropic Claude API", "LLM service for qualitative assessment (Haiku 4.5) and question generation (Sonnet 4.5)")
    System_Ext(supabase, "Supabase Cloud", "Managed BaaS: Auth, PostgreSQL, Storage, Realtime, Edge Functions (EU/Ireland)")

    Rel(educator, platform, "Uploads exams, reviews assessments, generates questions", "HTTPS")
    Rel(platform, claude, "Sends validation & generation prompts", "HTTPS / REST")
    Rel(platform, supabase, "Auth, data persistence, file storage, serverless functions", "HTTPS")
```

## Level 2: Container

```mermaid
C4Container
    title Container Diagram — MC Toetsvalidatie & Generatie Platform

    Person(educator, "Educator", "Uploads MC questions, reviews quality scores, generates new questions")

    System_Boundary(platform, "MC Toetsvalidatie Platform") {
        Container(spa, "React SPA", "Vite, React 19, TypeScript, Tailwind CSS", "Single-page application for exam upload, quality dashboard, and question generation")
        Container(edge, "Edge Functions", "Deno 2, TypeScript", "Lightweight API layer: validates JWT, checks ownership, delegates to sidecar")
        Container(sidecar, "Python Sidecar", "FastAPI, uvicorn, Python 3.12", "AI orchestration: deterministic analysis, LLM calls, RAG pipeline, file parsing")
        ContainerDb(db, "PostgreSQL + pgvector", "Supabase Postgres", "Exams, questions, assessments, chunks (768-dim vectors), generation jobs")
        Container(storage, "File Storage", "Supabase Storage, S3-compatible", "Buckets: uploads (exam files), materials (study documents)")
        Container(auth, "Auth Service", "Supabase Auth", "JWT-based authentication with email/password login")
        Container(realtime, "Realtime", "Supabase Realtime", "Publishes exam table changes for live progress updates")
    }

    System_Ext(claude, "Anthropic Claude API", "LLM for validation (Haiku 4.5, temp 0.0) and generation (Sonnet 4.5, temp 0.5)")

    Rel(educator, spa, "Uses", "HTTPS")
    Rel(spa, auth, "Authenticates", "Supabase JS SDK")
    Rel(spa, edge, "API calls: analyze, generate, embed, export", "HTTPS + JWT")
    Rel(spa, sidecar, "File parsing: /parse, /validate, /repair", "HTTPS")
    Rel(spa, db, "CRUD queries: exams, questions, materials", "Supabase JS SDK + RLS")
    Rel(spa, storage, "Upload/download exam files and study materials", "Supabase JS SDK")
    Rel(spa, realtime, "Subscribes to exam progress updates", "WebSocket")
    Rel(edge, db, "Read/write with service_role key", "Supabase client")
    Rel(edge, sidecar, "Delegates AI processing (fire-and-forget)", "HTTP POST")
    Rel(sidecar, db, "Read questions, write assessments, manage chunks", "Supabase client (service_role)")
    Rel(sidecar, storage, "Downloads files for text extraction", "Supabase Storage API")
    Rel(sidecar, claude, "Structured output via tool_choice", "HTTPS / REST")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

## Level 3: Component — Edge Functions

```mermaid
C4Component
    title Component Diagram — Supabase Edge Functions (Deno 2)

    Container_Boundary(edge, "Edge Functions") {
        Component(analyze, "analyze", "POST /functions/v1/analyze", "Triggers validation pipeline for full exam or single question reassessment")
        Component(generate, "generate", "POST /functions/v1/generate", "Creates generation job, delegates RAG-based question creation to sidecar")
        Component(embed, "embed-material", "POST /functions/v1/embed-material", "Triggers chunking + embedding of uploaded study material")
        Component(export, "export", "GET /functions/v1/export", "Generates CSV or Markdown export of exam results with assessments")
    }

    Container_Ext(spa, "React SPA", "Frontend application")
    ContainerDb_Ext(db, "PostgreSQL", "Exams, questions, assessments, jobs")
    Container_Ext(sidecar, "Python Sidecar", "AI processing")

    Rel(spa, analyze, "exam_id, question_id?", "HTTPS + JWT")
    Rel(spa, generate, "material_id, exam_id, specification", "HTTPS + JWT")
    Rel(spa, embed, "material_id", "HTTPS + JWT")
    Rel(spa, export, "exam_id, format", "HTTPS + JWT")

    Rel(analyze, db, "Verify ownership, update analysis_status", "service_role")
    Rel(generate, db, "Create generation_job record", "service_role")
    Rel(embed, db, "Verify material ownership", "service_role")
    Rel(export, db, "Query questions + assessments", "service_role")

    Rel(analyze, sidecar, "POST /analyze", "HTTP, fire-and-forget")
    Rel(generate, sidecar, "POST /generate", "HTTP, fire-and-forget")
    Rel(embed, sidecar, "POST /embed", "HTTP, fire-and-forget")
```

## Level 3: Component — Python Sidecar

```mermaid
C4Component
    title Component Diagram — Python Sidecar (FastAPI on Google Cloud Run, europe-west1)

    Container_Boundary(sidecar, "Python Sidecar") {

        Component(api, "FastAPI Routers", "HTTP endpoints", "Routes: /parse, /validate, /repair, /analyze, /embed, /generate, /health")

        Component(validation, "ValidationPipeline", "services/validation_pipeline.py", "Orchestrates 2-layer analysis per question, writes assessments, tracks progress")
        Component(generation, "GenerationPipeline", "services/generation_pipeline.py", "RAG retrieve → LLM generate → validate → store questions")
        Component(embedding, "EmbeddingPipeline", "services/embedding_pipeline.py", "Extract text → chunk → embed → store in pgvector")

        Component(deterministic, "DeterministicAnalyzer", "analyzers/deterministic.py", "Rule-based checks: longest-answer bias, homogeneity, absolute terms, negation")
        Component(llm, "LLMClient", "llm/client.py", "Claude API integration with structured output (tool_choice + JSON schema)")
        Component(prompts, "Prompt Builders", "llm/prompts/", "Constructs system + user messages with embedded criteria markdown")

        Component(embedder, "Embedder", "rag/embedder.py", "In-container multilingual-e5-base (768 dims) via sentence-transformers")
        Component(chunker, "Chunker", "rag/chunker.py", "Splits text into ~500-token chunks with 50-token overlap")
        Component(extractor, "Extractor", "rag/extractor.py", "Extracts text from PDF (pdfplumber), DOCX (python-docx), TXT")
        Component(retriever, "Retriever", "rag/retriever.py", "Embeds query, calls match_chunks() RPC for cosine similarity search")

        Component(parsers, "File Parsers", "parsers/", "Parses CSV, XLSX, DOCX exam files into structured questions")
    }

    ContainerDb_Ext(db, "PostgreSQL + pgvector", "Questions, assessments, chunks")
    Container_Ext(claude, "Anthropic Claude API", "Haiku 4.5 / Sonnet 4.5")
    Container_Ext(storage, "Supabase Storage", "Uploaded files")

    Rel(api, validation, "POST /analyze")
    Rel(api, generation, "POST /generate")
    Rel(api, embedding, "POST /embed")
    Rel(api, parsers, "POST /parse")

    Rel(validation, deterministic, "Layer 1: rule-based flags")
    Rel(validation, llm, "Layer 2: qualitative scores")
    Rel(validation, db, "Read questions, write assessments, increment progress")

    Rel(generation, retriever, "Retrieve relevant chunks")
    Rel(generation, llm, "Generate questions from chunks")
    Rel(generation, validation, "Auto-validate generated questions")
    Rel(generation, db, "Write questions, update job status")

    Rel(embedding, extractor, "Extract text from file")
    Rel(embedding, chunker, "Split into chunks")
    Rel(embedding, embedder, "Generate 768-dim embeddings")
    Rel(embedding, db, "Insert chunks + vectors")
    Rel(embedding, storage, "Download source file")

    Rel(llm, prompts, "Build messages from criteria files")
    Rel(llm, claude, "Structured output via tool_choice", "HTTPS")
    Rel(retriever, embedder, "Embed search query")
    Rel(retriever, db, "RPC match_chunks()", "Cosine similarity")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

## Deployment Overview

| Container | Technology | Deployment Platform | Region |
|-----------|-----------|-------------------|--------|
| React SPA | Vite + React 19 + TypeScript | GitHub Pages | Global CDN |
| Edge Functions | Deno 2, TypeScript | Supabase Cloud | EU / Ireland |
| Python Sidecar | FastAPI, Python 3.12 | Google Cloud Run | europe-west1 |
| PostgreSQL + pgvector | Supabase Postgres | Supabase Cloud | EU / Ireland |
| File Storage | S3-compatible buckets | Supabase Cloud | EU / Ireland |
| Auth Service | Supabase Auth (JWT) | Supabase Cloud | EU / Ireland |
| Realtime | Supabase Realtime | Supabase Cloud | EU / Ireland |
