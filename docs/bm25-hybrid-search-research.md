# BM25 & Hybrid Search: Research Findings for MC Toetsgenerator

## Summary

BM25-based hybrid search (keyword + vector) would meaningfully improve RAG retrieval quality for Module B question generation. The most practical path is **native Postgres tsvector + pgvector with Reciprocal Rank Fusion (RRF)** — zero additional infrastructure, works on Supabase Cloud today, and supports Dutch out of the box.

---

## 1. What BM25 Is

BM25 (Best Matching 25) is the industry-standard text ranking algorithm used by Elasticsearch, Solr, and Lucene. It improves on naive keyword counting with four mechanisms:

- **Term frequency saturation** — mentioning a word 12x doesn't score 12x higher; diminishing returns kick in after a few mentions
- **Inverse Document Frequency (IDF)** — rare terms ("Hardy-Weinberg") carry more weight than common terms ("de", "een", "student")
- **Length normalization** — a focused 50-word chunk about your query beats an 800-word document mentioning it in passing
- **Ranked retrieval** — every document gets a meaningful relevance score, not boolean match/no-match

---

## 2. Why It Matters for Our RAG Pipeline

Our current retrieval is **vector-only** (cosine similarity via pgvector HNSW index). This works well for semantic matching but has known blind spots:

| Scenario | Vector-only (current) | Hybrid (BM25 + vector) |
|---|---|---|
| Learning goal mentions "Hardy-Weinberg evenwicht" | Returns genetics content broadly | Also finds chunks with the exact term |
| Query uses specific formula name or abbreviation | May retrieve adjacent concepts | Exact lexical match surfaces first |
| Query is abstract ("pas hogere-orde denken toe") | Works well — semantic similarity excels | Vector results dominate the combined score |
| Domain-specific Dutch terminology | Can miss exact terminology in favor of paraphrases | Finds exact terms AND paraphrases |

The Tiger Data article confirms that **every major AI search system uses hybrid search**: LangChain's EnsembleRetriever, Cohere Rerank, Pinecone's hybrid mode. The reason is simple — keywords and meaning capture different signals, and combining them via RRF consistently outperforms either alone.

**For our use case specifically:** When generating MC questions grounded in study materials, retrieving chunks that contain the exact terminology from the learning objective is critical for factual accuracy. A chunk that paraphrases the concept but uses different words may lead to questions that don't align with the source material's vocabulary.

---

## 3. Extension Options Evaluated

| Option | Extension | True BM25 | Supabase Cloud | Dutch | Status |
|---|---|---|---|---|---|
| **pg_textsearch** (Timescale/Tiger Data) | `pg_textsearch` | Yes | **Not available** | Unknown | New (Dec 2025), Postgres 17/18 |
| **pg_search** (ParadeDB) | `pg_search` | Yes | **Not available** (partner, no integration) | Yes | Stable (v0.6+) |
| **Native tsvector + ts_rank_cd** | Built-in | No (but close enough) | **Yes, always available** | **Yes** (`'dutch'` config) | Battle-tested |

**Key finding:** Neither `pg_textsearch` nor `pg_search` is available on Supabase Cloud. Both would require self-hosting Postgres. However, **native Postgres tsvector with the `'dutch'` text search configuration** is available everywhere and provides the most impactful improvements (IDF-like weighting, length normalization, stemming).

The difference between true BM25 and `ts_rank_cd` is the term frequency saturation curve. For our use case — ~500-token educational text chunks, not web-scale spam corpora — this difference is negligible. The big win is **combining any keyword signal with the vector signal**, which native tsvector provides.

---

## 4. Supabase's Official Hybrid Search Pattern

Supabase has a documented hybrid search approach that combines tsvector (keyword) and pgvector (semantic) using **Reciprocal Rank Fusion (RRF)**:

```
score = 1/(k + rank_keyword) + 1/(k + rank_semantic)
```

Where `k` is a smoothing constant (typically 50). This is the same fusion method used by LangChain, Pinecone, and other production systems.

The pattern:
1. A `tsvector` column (auto-generated from chunk text) with a GIN index
2. The existing pgvector `embedding` column with HNSW index
3. A SQL function that runs both searches, ranks results separately, and combines scores via RRF
4. Configurable weights (e.g., `full_text_weight=1.5, semantic_weight=1.0` to bias toward keywords)

**Dutch language support:** PostgreSQL includes a built-in `'dutch'` text search configuration with Dutch stemming (e.g., "vergelijkingen" → "vergelijk") and stop word removal. Usage: `to_tsvector('dutch', chunk_text)`.

---

## 5. Impact on Current Architecture

### What would change

| Component | Current | With hybrid search |
|---|---|---|
| `chunks` table | `embedding vector(768)` | + `fts tsvector` (auto-generated, Dutch) |
| Index | HNSW on embedding | + GIN on fts |
| DB function | `match_chunks()` (vector only) | + `hybrid_search_chunks()` (RRF) |
| `sidecar/rag/retriever.py` | Embeds query → RPC call | Embeds query + passes raw text → RPC call |
| Embedding pipeline | No changes | tsvector auto-populates on INSERT |

### What stays the same

- Embedding model (multilingual-e5-base, in-container)
- Chunk size and overlap (2000 chars / 200 overlap)
- LLM prompt building and generation flow
- Frontend — no changes needed
- All existing validation logic (Module A)

### Effort estimate

- One new Supabase migration (ALTER TABLE + CREATE INDEX + CREATE FUNCTION)
- ~20 lines of Python in `retriever.py`
- ~3 lines changed in `generation_pipeline.py`

---

## 6. Risks & Considerations

- **Dutch stemming quality:** PostgreSQL's built-in Dutch stemmer is adequate but not perfect for highly specialized academic terminology. Domain-specific compounds may not stem correctly. Mitigation: the hybrid approach means vector search still covers semantic gaps.
- **tsvector column storage:** Adds ~20-30% storage to the chunks table for the tsvector data + GIN index. Negligible at our scale.
- **Query syntax:** `websearch_to_tsquery('dutch', ...)` supports natural language queries, but edge cases with special characters or formulas may need escaping.
- **Future upgrade path:** If Supabase adds `pg_textsearch` or `pg_search` support, the hybrid function signature can stay identical — only the internal ranking changes from `ts_rank_cd` to true BM25 scoring.

---

## 7. Conclusion

BM25 hybrid search is a high-value, low-effort improvement to the RAG pipeline. The recommended approach — native Postgres tsvector + pgvector with RRF — requires no additional services, works on Supabase Cloud, supports Dutch, and follows Supabase's own documented pattern. It addresses the key weakness of vector-only retrieval (missing exact keyword matches) while preserving all the benefits of semantic search.

---

## Sources

- [Tiger Data: You Don't Need Elasticsearch: BM25 is Now in Postgres](https://www.tigerdata.com/blog/you-dont-need-elasticsearch-bm25-is-now-in-postgres) (Dec 2025)
- [Supabase Docs: Hybrid Search](https://supabase.com/docs/guides/ai/hybrid-search)
- [Supabase Docs: Full Text Search](https://supabase.com/docs/guides/database/full-text-search)
- [Supabase + ParadeDB Partnership](https://supabase.com/partners/integrations/paradedb)
- [GitHub Discussion: pg_bm25 for Supabase](https://github.com/orgs/supabase/discussions/18061)
- [ParadeDB: BM25 Concepts](https://docs.paradedb.com/documentation/concepts/bm25)
- [PostgreSQL Docs: Text Search Controls](https://www.postgresql.org/docs/current/textsearch-controls.html)
- [pg_textsearch GitHub](https://github.com/timescale/pg_textsearch)
