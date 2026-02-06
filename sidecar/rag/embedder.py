from sentence_transformers import SentenceTransformer

MODEL_NAME = "intfloat/multilingual-e5-base"
EMBEDDING_DIMENSIONS = 768
BATCH_SIZE = 100

# Load model once at module level (cached across requests)
_model: SentenceTransformer | None = None


def _get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


async def embed_chunks(texts: list[str]) -> list[list[float]]:
    """Generate embeddings using multilingual-e5-base (in-container).

    The E5 model expects "passage: " prefix for documents.
    Returns a list of 768-dimensional float vectors.
    """
    model = _get_model()
    prefixed = [f"passage: {t}" for t in texts]
    embeddings = model.encode(prefixed, batch_size=BATCH_SIZE, normalize_embeddings=True)
    return [emb.tolist() for emb in embeddings]


async def embed_query(query: str) -> list[float]:
    """Generate a single query embedding with the 'query: ' prefix."""
    model = _get_model()
    embedding = model.encode(f"query: {query}", normalize_embeddings=True)
    return embedding.tolist()
