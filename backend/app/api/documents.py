from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..config import settings
from ..services.ingestion_service import IngestionService

router = APIRouter(prefix="/documents", tags=["documents"])
ingestion = IngestionService()

ALLOWED = {
    ".pdf", ".docx", ".txt", ".md", ".py", ".js", ".jsx", ".ts", ".tsx",
    ".java", ".c", ".cpp", ".html", ".css", ".json", ".csv"
}

@router.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()

    if ext not in ALLOWED:
        raise HTTPException(400, f"Unsupported file type: {ext or 'unknown'}")

    data = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(413, f"File exceeds {settings.max_file_size_mb} MB limit")

    document_id = str(uuid4())
    safe_name = Path(file.filename).name
    path = Path("data/uploads") / f"{document_id}_{safe_name}"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)

    result = await ingestion.ingest(path, document_id, safe_name)
    return result

@router.get("")
async def list_documents():
    return {"documents": ingestion.list_documents()}
