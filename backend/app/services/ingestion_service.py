from pathlib import Path
from typing import Iterable

import fitz
from docx import Document

from ..config import settings
from .qdrant_service import QdrantService

class IngestionService:
    def __init__(self):
        self.qdrant = QdrantService()

    async def ingest(self, path: Path, document_id: str, filename: str):
        pages = self.extract(path)
        chunks = list(self.chunk_pages(pages))

        for chunk in chunks:
            chunk["document_id"] = document_id
            chunk["filename"] = filename

        self.qdrant.upsert(chunks)

        return {
            "document_id": document_id,
            "filename": filename,
            "chunks_indexed": len(chunks),
            "status": "ready",
        }

    def extract(self, path: Path) -> list[dict]:
        ext = path.suffix.lower()

        if ext == ".pdf":
            doc = fitz.open(path)
            return [
                {"text": page.get_text("text"), "page": i + 1}
                for i, page in enumerate(doc)
            ]

        if ext == ".docx":
            doc = Document(path)
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())
            return [{"text": text, "page": None}]

        text = path.read_text(encoding="utf-8", errors="ignore")
        return [{"text": text, "page": None}]

    def chunk_pages(self, pages: Iterable[dict]):
        size = settings.chunk_size
        overlap = settings.chunk_overlap

        for page in pages:
            text = " ".join(page["text"].split())
            if not text:
                continue

            start = 0
            chunk_no = 0
            while start < len(text):
                end = min(start + size, len(text))
                chunk = text[start:end].strip()

                if chunk:
                    yield {
                        "chunk_id": f"{page.get('page') or 0}-{chunk_no}",
                        "text": chunk,
                        "page": page.get("page"),
                    }

                if end >= len(text):
                    break

                start = max(end - overlap, start + 1)
                chunk_no += 1

    def list_documents(self):
        folder = Path("data/uploads")
        return [
            {"filename": p.name, "size": p.stat().st_size}
            for p in folder.iterdir() if p.is_file()
        ]
