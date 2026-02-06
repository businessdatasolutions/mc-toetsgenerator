-- ============================================================
-- Migration: switch_embeddings_768
-- Switch from OpenAI text-embedding-3-small (1536) to
-- multilingual-e5-base (768) for in-container embeddings.
-- ============================================================

-- Drop existing HNSW index (dimension mismatch would block ALTER)
drop index if exists idx_chunks_embedding;

-- Clear any existing embeddings (they're incompatible with new dimensions)
update chunks set embedding = null;

-- Change the embedding column from vector(1536) to vector(768)
alter table chunks alter column embedding type vector(768);

-- Recreate HNSW index with new dimensions
create index idx_chunks_embedding on chunks using hnsw (embedding vector_cosine_ops);

-- Update match_chunks() function to accept vector(768)
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
