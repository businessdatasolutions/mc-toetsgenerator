from dataclasses import dataclass, field


@dataclass
class Chunk:
    text: str
    position: int
    page: int | None = None
    metadata: dict = field(default_factory=dict)


# ~500 tokens ≈ 2000 characters; overlap ~50 tokens ≈ 200 characters
CHUNK_SIZE = 2000
CHUNK_OVERLAP = 200


def chunk_text(
    text: str,
    metadata: dict | None = None,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> list[Chunk]:
    """Split text into overlapping chunks, preferring paragraph boundaries."""
    if not text.strip():
        return []

    meta = metadata or {}

    # If text fits in one chunk, return it directly
    if len(text) <= chunk_size:
        return [Chunk(text=text.strip(), position=0, metadata=meta)]

    chunks: list[Chunk] = []
    start = 0
    position = 0

    while start < len(text):
        end = start + chunk_size

        if end < len(text):
            # Try to split at a paragraph boundary (double newline)
            boundary = text.rfind("\n\n", start, end)
            if boundary > start + chunk_size // 2:
                end = boundary + 2  # Include the newlines
            else:
                # Try single newline
                boundary = text.rfind("\n", start, end)
                if boundary > start + chunk_size // 2:
                    end = boundary + 1
                else:
                    # Try space
                    boundary = text.rfind(" ", start, end)
                    if boundary > start + chunk_size // 2:
                        end = boundary + 1

        chunk_text_content = text[start:end].strip()
        if chunk_text_content:
            chunks.append(
                Chunk(text=chunk_text_content, position=position, metadata=meta)
            )
            position += 1

        # Move start forward by (end - overlap), ensuring progress
        start = max(start + 1, end - chunk_overlap)

    return chunks


def chunk_pages(
    pages: list,  # list[PageText]
    metadata: dict | None = None,
    chunk_size: int = CHUNK_SIZE,
    chunk_overlap: int = CHUNK_OVERLAP,
) -> list[Chunk]:
    """Chunk a list of PageText objects, preserving page numbers."""
    meta = metadata or {}
    all_chunks: list[Chunk] = []
    position = 0

    for page in pages:
        page_chunks = chunk_text(
            page.text, metadata=meta, chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )
        for chunk in page_chunks:
            chunk.page = page.page_number
            chunk.position = position
            position += 1
            all_chunks.append(chunk)

    return all_chunks
