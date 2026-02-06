from rag.chunker import Chunk
from rag.embedder import embed_query


async def retrieve_chunks(
    query: str,
    material_id: str,
    supabase,
    top_k: int = 5,
) -> list[Chunk]:
    """Retrieve the most relevant chunks for a query using vector similarity.

    Args:
        query: The search query text (e.g., a learning objective).
        material_id: The material to search within.
        supabase: Supabase client instance.
        top_k: Number of top results to return.

    Returns:
        List of Chunk objects sorted by similarity.
    """
    # 13.1a: Generate embedding for the query (with "query: " prefix)
    query_embedding = await embed_query(query)

    # 13.1b: Call match_chunks RPC
    result = supabase.rpc(
        "match_chunks",
        {
            "query_embedding": query_embedding,
            "match_count": top_k,
            "filter_material_id": material_id,
        },
    ).execute()

    # 13.1c: Convert to Chunk objects
    chunks = []
    for row in result.data or []:
        chunks.append(
            Chunk(
                text=row["content"],
                position=row.get("position", 0),
                page=row.get("page"),
                metadata=row.get("metadata", {}),
            )
        )

    return chunks
