from fastapi import FastAPI

app = FastAPI(title="MC Toetsvalidatie Sidecar")


@app.get("/health")
async def health():
    return {"status": "ok"}
