import asyncio

from fastapi import BackgroundTasks, FastAPI
from pydantic import BaseModel

from llm.client import LLMClient
from services.supabase_client import get_supabase_client
from services.validation_pipeline import run_validation

app = FastAPI(title="MC Toetsvalidatie Sidecar")


class AnalyzeRequest(BaseModel):
    exam_id: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    supabase = get_supabase_client()
    llm_client = LLMClient()

    background_tasks.add_task(
        asyncio.run,
        run_validation(request.exam_id, supabase, llm_client),
    )

    return {"status": "processing", "exam_id": request.exam_id}
