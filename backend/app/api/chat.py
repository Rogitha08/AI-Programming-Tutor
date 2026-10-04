from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.rag_service import RAGService

router = APIRouter(prefix="/chat", tags=["chat"])
rag = RAGService()


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    session_id: str | None = None
    top_k: int | None = None
    document_id: str | None = None


class Source(BaseModel):
    document_id: str
    filename: str
    page: int | None = None
    chunk_id: str
    score: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[Source]
    session_id: str


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest):
    result = await rag.answer(
        query=request.message,
        session_id=request.session_id,
        top_k=request.top_k,
        document_id=request.document_id,
    )
    return result