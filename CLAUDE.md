# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MC Toetsvalidatie & Generatie Platform — an AI-powered web application for Dutch higher education that validates and generates multiple-choice exam questions. All implementation follows the PRD at `docs/prd-mc-toetsvalidatie.md`.

**Two modules:**
- **Module A (Validation):** Upload MC questions → deterministic + LLM analysis on 3 quality dimensions → dashboard with improvement suggestions → export
- **Module B (Generation):** Upload study materials → RAG-driven question generation → automatic quality check → educator review → export

## Key Documentation

- `docs/prd-mc-toetsvalidatie.md` — Full product requirements document (architecture, data model, API design, user flows, roadmap)
- `docs/criteria-betrouwbaarheid.md` — Reliability assessment criteria (discrimination, ambiguity, guessing reduction; scored 1-5)
- `docs/criteria-technisch.md` — Technical quality criteria (stem clarity, distractor plausibility, deterministic flags; scored 1-5)
- `docs/criteria-validiteit.md` — Validity criteria (Bloom's cognitive level, learning objective alignment; scored 1-5)
- `docs/Blooms-taxonomy-for-learning-objectives-TU-Delft-Sep-2019.pdf` — Bloom's taxonomy reference
- `docs/llm-configuratie.md` — LLM model selection, pricing, and configuration details
- `docs/llm-models-overview.md` — Comprehensive comparison of Anthropic Claude vs Google Gemini models

The three criteria files are the **single source of truth** for quality assessment and are meant to be embedded directly into LLM prompts.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vite + React + TypeScript (static SPA, hosted on GitHub Pages) |
| Backend API | Supabase Edge Functions |
| AI Processing | Python sidecar (FastAPI) for LLM orchestration and deterministic analysis |
| Database | Supabase PostgreSQL with pgvector extension |
| Vector Store | pgvector for RAG embeddings (768 dimensions) |
| File Storage | Supabase Storage (S3-compatible) |
| Auth | Supabase Auth (SAML/OIDC SSO) |
| LLM | Anthropic Claude API (Haiku 4.5 for validation, Sonnet 4.5 for generation) |
| Embeddings | `intfloat/multilingual-e5-base` via sentence-transformers (in-container, no external API) |
| Deployment | Frontend on GitHub Pages; Supabase Cloud (EU/Ireland); Python sidecar on Google Cloud Run (europe-west1) |

## Architecture

**Two-layer AI strategy:**
1. **Deterministic layer** (Python) — rule-based checks: longest-answer bias, answer-length homogeneity, absolute terms, negation handling. Fast, free, reproducible.
2. **LLM layer** (Claude API) — qualitative evaluation: discriminative power, semantic clarity, distractor plausibility, cognitive level classification. Temperature 0.0 for validation, 0.4–0.7 for generation.

**RAG pipeline for generation:** Ingest → Chunk (~500 tokens, 50 overlap) → Embed → Retrieve (top-k) → Generate (grounded in source chunks)

**Three independent quality dimensions** — no composite score. Each dimension produces its own 1-5 score plus explanatory text.

## Task Plan & Workflow

The task plan in `memory/tasks.md` is the **leading document** for all implementation work and must be **strictly followed** in order, unless the user explicitly instructs otherwise.

**Mandatory workflow after each task group's tests pass:**
1. **Commit & push** all changes with a descriptive commit message.
2. **Mark completed tasks** — update `memory/tasks.md` by checking off (`- [x]`) all finished subtasks and their corresponding tests.
3. **Proceed** to the next group of subtasks.

**Rules:**
- Do NOT skip ahead to a later task group while the current group has unchecked items.
- Do NOT mark a task as completed until its tests have passed and the code has been committed and pushed.
- If a test fails, fix the issue before moving on — never leave failing tests behind.

## Domain Conventions

- All user-facing content is in **Dutch**
- Quality scores use a 1-5 scale: Excellent (5) / Good (4) / Adequate (3) / Weak (2) / Poor (1)
- Bloom levels used: Onthouden, Begrijpen, Toepassen, Analyseren
- Human-in-the-loop: AI outputs are always proposals requiring educator review — no auto-fix
- Deterministic analysis fields are prefixed `tech_kwant_*`; AI assessment fields use `bet_*`, `tech_kwal_*`, `val_*`

## temp/ Folder — Do NOT Delete

The `temp/` folder contains an **isolated API integration prototype** used to validate the Claude API structured output approach (tool_choice with JSON schema) and the 3-dimension quality assessment prompt before building it into the main application. It has its own `package.json` and runs independently from the main Vite project. This prototype serves as a reference implementation for Task 6 (LLM Client & Structured Output) in the task plan.
