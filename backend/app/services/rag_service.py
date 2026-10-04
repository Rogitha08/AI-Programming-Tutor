from uuid import uuid4

from ..config import settings
from .qdrant_service import QdrantService
from .llm_service import LLMService


class RAGService:
    def __init__(self):
        self.qdrant = QdrantService()
        self.llm = LLMService()

    async def answer(
        self,
        query: str,
        session_id: str | None = None,
        top_k: int | None = None,
        document_id: str | None = None,
    ):
        session_id = session_id or str(uuid4())

        # ---------------------------------------------------------
        # CASE 1: NO DOCUMENT ATTACHED
        # Answer normally without searching uploaded PDFs.
        # ---------------------------------------------------------
        if not document_id:

            prompt = f"""
You are an AI Programming Tutor.

The user is asking a general programming question.

Question:
{query}

Instructions:
1. Answer the question using your general programming knowledge.
2. Do NOT use or refer to any uploaded documents.
3. Do NOT mention the Qdrant knowledge base.
4. Explain the concept clearly and in a beginner-friendly way.
5. Include examples or code when useful.
"""

            answer = await self.llm.generate(prompt)

            return {
                "answer": answer,
                "sources": [],
                "session_id": session_id,
            }

        # ---------------------------------------------------------
        # CASE 2: DOCUMENT ATTACHED
        # Search ONLY the uploaded document.
        # ---------------------------------------------------------
        hits = self.qdrant.search(
            query=query,
            limit=top_k or settings.top_k,
            document_id=document_id,
        )

        # No relevant content found in this document
        if not hits:
            prompt = f"""
You are an AI Programming Tutor.

The user uploaded a document and asked a question.

Question:
{query}

The uploaded document does not contain relevant information
for answering this question.

Respond exactly with the idea that the information could not
be found in the uploaded document.

Do NOT answer using general knowledge.
Do NOT use information from other uploaded documents.
"""

            answer = await self.llm.generate(prompt)

            return {
                "answer": answer,
                "sources": [],
                "session_id": session_id,
            }

        # ---------------------------------------------------------
        # Build context ONLY from this document
        # ---------------------------------------------------------
        context_blocks = []
        sources = []

        for hit in hits:
            context_blocks.append(
                f"""
[File: {hit.get('filename')}
Page: {hit.get('page')}]

{hit.get('text', '')}
"""
            )

            sources.append({
                "document_id": hit.get("document_id", ""),
                "filename": hit.get("filename", ""),
                "page": hit.get("page"),
                "chunk_id": hit.get("chunk_id", ""),
                "score": round(float(hit.get("score", 0)), 4),
            })

        context = "\n\n".join(context_blocks)

        prompt = f"""
You are an AI Programming Tutor.

The user has uploaded a document and wants an answer based ONLY
on that document.

Question:
{query}

Uploaded document content:
{context}

STRICT RULES:

1. Answer ONLY using the uploaded document content above.
2. Do NOT use knowledge from other uploaded documents.
3. Do NOT use general knowledge to fill missing information.
4. Do NOT invent information.
5. If the answer is not supported by the uploaded document,
   say:

   "I couldn't find the answer to this question in the uploaded document."

6. If the answer is present, explain it clearly and simply.
7. If useful, include code examples from the document.
"""

        answer = await self.llm.generate(prompt)

        return {
            "answer": answer,
            "sources": sources,
            "session_id": session_id,
        }