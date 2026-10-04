from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .api import health, chat, documents, multimodal, debugger

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Multimodal RAG backend for an AI Programming Tutor.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix=settings.api_prefix)
app.include_router(chat.router, prefix=settings.api_prefix)
app.include_router(documents.router, prefix=settings.api_prefix)
app.include_router(multimodal.router, prefix=settings.api_prefix)
app.include_router(debugger.router, prefix=settings.api_prefix)

@app.get("/")
async def root():
    return {"message": "AI Programming Tutor API", "docs": "/docs"}
