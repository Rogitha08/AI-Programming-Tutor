from fastapi import APIRouter
from pydantic import BaseModel, Field

from ..services.code_service import CodeService

router = APIRouter(prefix="/code", tags=["code"])

code_service = CodeService()


class CodeRequest(BaseModel):
    code: str = Field(min_length=1)
    language: str = "python"


@router.post("/analyze")
async def analyze_code(request: CodeRequest):
    return await code_service.analyze(
        code=request.code,
        language=request.language,
    )