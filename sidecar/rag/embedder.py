import httpx

from config.settings import settings

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
BATCH_SIZE = 100


async def embed_chunks(texts: list[str]) -> list[list[float]]:
    """Generate embeddings for a list of text strings using OpenAI API.

    Batches requests in groups of BATCH_SIZE.
    Returns a list of 1536-dimensional float vectors.
    """
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        embeddings = await _embed_batch(batch)
        all_embeddings.extend(embeddings)

    return all_embeddings


async def _embed_batch(texts: list[str]) -> list[list[float]]:
    """Send a single batch to the OpenAI embeddings API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.openai.com/v1/embeddings",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": EMBEDDING_MODEL,
                "input": texts,
            },
            timeout=60.0,
        )
        response.raise_for_status()
        data = response.json()

    return [item["embedding"] for item in data["data"]]
