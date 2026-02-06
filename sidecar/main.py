import asyncio

from fastapi import BackgroundTasks, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from llm.client import LLMClient
from parsers.csv_parser import parse_csv
from parsers.docx_parser import parse_docx
from parsers.xlsx_parser import parse_xlsx
from services.embedding_pipeline import run_embedding
from services.generation_pipeline import run_generation
from services.supabase_client import get_supabase_client
from services.validation_pipeline import run_single_validation, run_validation

app = FastAPI(title="MC Toetsvalidatie Sidecar")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://businessdatasolutions.github.io",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    exam_id: str
    question_id: str | None = None


class EmbedRequest(BaseModel):
    material_id: str


class GenerateRequest(BaseModel):
    job_id: str


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest, background_tasks: BackgroundTasks):
    supabase = get_supabase_client()
    llm_client = LLMClient()

    if request.question_id:
        background_tasks.add_task(
            asyncio.run,
            run_single_validation(
                request.exam_id, request.question_id, supabase, llm_client
            ),
        )
    else:
        background_tasks.add_task(
            asyncio.run,
            run_validation(request.exam_id, supabase, llm_client),
        )

    return {"status": "processing", "exam_id": request.exam_id}


@app.post("/embed")
async def embed(request: EmbedRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        asyncio.run,
        run_embedding(request.material_id),
    )
    return {"status": "processing", "material_id": request.material_id}


@app.post("/generate")
async def generate(request: GenerateRequest, background_tasks: BackgroundTasks):
    background_tasks.add_task(
        asyncio.run,
        run_generation(request.job_id),
    )
    return {"status": "processing", "job_id": request.job_id}


@app.post("/parse")
async def parse(file: UploadFile = File(...)):
    """Parse an uploaded file (CSV, XLSX, or DOCX) into structured questions."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Geen bestandsnaam opgegeven")

    content = await file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""

    try:
        if ext == "csv":
            questions = parse_csv(content)
        elif ext == "xlsx":
            questions = parse_xlsx(content)
        elif ext == "docx":
            questions = parse_docx(content)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Onondersteund bestandsformaat: .{ext}. Gebruik CSV, XLSX of DOCX.",
            )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return [q.model_dump() for q in questions]
