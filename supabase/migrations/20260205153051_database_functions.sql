-- ============================================================
-- Migration: database_functions
-- match_chunks() and exam_score_summary()
-- ============================================================

-- 3.9 Vector similarity search for RAG retrieval
create or replace function match_chunks(
  query_embedding vector(1536),
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

-- 3.10 Aggregated exam score summary
create or replace function exam_score_summary(p_exam_id uuid)
returns table (
  total_questions int,
  avg_bet_score numeric,
  avg_tech_score numeric,
  avg_val_score numeric,
  count_critical int
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
