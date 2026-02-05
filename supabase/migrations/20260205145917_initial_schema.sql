-- ============================================================
-- Migration: initial_schema
-- MC Toetsvalidatie & Generatie Platform
-- ============================================================

-- 2.3 Extensions
create extension if not exists "vector";
create extension if not exists "pg_net" with schema "extensions";

-- 2.4 Enum types
create type bloom_level as enum ('onthouden', 'begrijpen', 'toepassen', 'analyseren');
create type question_source as enum ('manual', 'generated', 'imported');
create type analysis_status as enum ('pending', 'processing', 'completed', 'failed');
create type discriminatie_level as enum ('hoog', 'gemiddeld', 'laag', 'geen');
create type ambiguiteit_level as enum ('geen', 'licht', 'hoog');

-- 2.5 Table: exams
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

-- 2.6 Table: questions
create table questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  position int not null,
  stem text not null,
  options jsonb not null,
  correct_option int not null,
  bloom_level bloom_level,
  learning_goal text,
  version int not null default 1,
  source question_source not null default 'imported',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint valid_options check (jsonb_array_length(options) >= 2)
);

create index idx_questions_exam_id on questions(exam_id);

-- 2.7 Table: assessments
create table assessments (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references questions(id) on delete cascade,
  question_version int not null,

  -- Deterministisch (tech_kwant_*)
  tech_kwant_longest_bias boolean,
  tech_kwant_homogeneity_score float,
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
  improvement_suggestions jsonb default '[]',

  created_at timestamptz default now(),

  constraint unique_question_version unique (question_id, question_version)
);

create index idx_assessments_question_id on assessments(question_id);

-- 2.8 Table: materials
create table materials (
  id uuid primary key default gen_random_uuid(),
  uploaded_by uuid not null references auth.users(id),
  exam_id uuid references exams(id) on delete set null,
  filename text not null,
  mime_type text not null,
  storage_path text not null,
  content_text text,
  chunk_count int default 0,
  created_at timestamptz default now()
);

create index idx_materials_uploaded_by on materials(uploaded_by);
create index idx_materials_exam_id on materials(exam_id);

-- 2.9 Table: chunks
create table chunks (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id) on delete cascade,
  text text not null,
  embedding vector(1536),
  page int,
  position int not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index idx_chunks_material_id on chunks(material_id);
create index idx_chunks_embedding on chunks using hnsw (embedding vector_cosine_ops);

-- 2.10 Table: generation_jobs
create table generation_jobs (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  material_id uuid references materials(id),
  exam_id uuid references exams(id),
  specification jsonb not null,
  status analysis_status default 'pending',
  result_question_ids uuid[] default '{}',
  error_message text,
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_generation_jobs_created_by on generation_jobs(created_by);
