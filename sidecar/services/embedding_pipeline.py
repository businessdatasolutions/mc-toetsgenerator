import json
import logging

from rag.chunker import Chunk, chunk_pages, chunk_text
from rag.embedder import embed_chunks
from rag.extractor import PageText, extract_text
from services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)


async def run_embedding(material_id: str) -> None:
    """Full embedding pipeline: download -> extract -> chunk -> embed -> store."""
    supabase = get_supabase_client()

    # 12.4a: Download file from Supabase Storage
    material = (
        supabase.table("materials")
        .select("*")
        .eq("id", material_id)
        .single()
        .execute()
    )
    if not material.data:
        raise ValueError(f"Material {material_id} not found")

    mat = material.data
    storage_path = mat["storage_path"]
    mime_type = mat["mime_type"]

    file_data = supabase.storage.from_("materials").download(storage_path)

    # 12.4b: Extract text
    extracted = extract_text(file_data, mime_type)

    # 12.4c: Chunk the text
    metadata = {"material_id": material_id}
    if isinstance(extracted, list):
        # list[PageText] from PDF
        chunks = chunk_pages(extracted, metadata=metadata)
        full_text = "\n\n".join(p.text for p in extracted)
    else:
        # str from DOCX or TXT
        chunks = chunk_text(extracted, metadata=metadata)
        full_text = extracted

    if not chunks:
        logger.warning(f"No chunks generated for material {material_id}")
        return

    # 12.4d: Generate embeddings
    chunk_texts = [c.text for c in chunks]
    embeddings = await embed_chunks(chunk_texts)

    # 12.4e: Write chunks + embeddings to Supabase
    chunk_rows = []
    for chunk, embedding in zip(chunks, embeddings):
        chunk_rows.append(
            {
                "material_id": material_id,
                "content": chunk.text,
                "embedding": json.dumps(embedding),
                "page": chunk.page,
                "position": chunk.position,
                "metadata": chunk.metadata,
            }
        )

    supabase.table("chunks").insert(chunk_rows).execute()

    # 12.4f: Update material record
    supabase.table("materials").update(
        {
            "content_text": full_text[:50000],  # Truncate if very large
            "chunk_count": len(chunks),
        }
    ).eq("id", material_id).execute()

    logger.info(
        f"Embedding pipeline complete for material {material_id}: "
        f"{len(chunks)} chunks"
    )
