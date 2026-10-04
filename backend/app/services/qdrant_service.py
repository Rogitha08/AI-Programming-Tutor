from uuid import uuid4

from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)

from ..config import settings
from .embedding_service import EmbeddingService


class QdrantService:
    def __init__(self):
        self.client = QdrantClient(
            url=settings.qdrant_url,
            api_key=settings.qdrant_api_key or None,
        )
        self.embedder = EmbeddingService()
        self._ensure_collection()

    def _ensure_collection(self):
        collections = self.client.get_collections().collections
        names = {c.name for c in collections}

        if settings.qdrant_collection not in names:
            self.client.create_collection(
                collection_name=settings.qdrant_collection,
                vectors_config=VectorParams(
                    size=self.embedder.dimension,
                    distance=Distance.COSINE,
                ),
            )

    def upsert(self, chunks: list[dict]):
        if not chunks:
            return

        vectors = self.embedder.encode(
            [c["text"] for c in chunks]
        )

        points = []

        for chunk, vector in zip(chunks, vectors):
            points.append(
                PointStruct(
                    id=str(uuid4()),
                    vector=vector,
                    payload=chunk,
                )
            )

        self.client.upsert(
            collection_name=settings.qdrant_collection,
            points=points,
        )

    def search(
        self,
        query: str,
        limit: int = 5,
        document_id: str | None = None,
    ) -> list[dict]:

        vector = self.embedder.encode([query])[0]

        query_filter = None

        if document_id:
            query_filter = Filter(
                must=[
                    FieldCondition(
                        key="document_id",
                        match=MatchValue(value=document_id),
                    )
                ]
            )

        result = self.client.query_points(
            collection_name=settings.qdrant_collection,
            query=vector,
            query_filter=query_filter,
            limit=limit,
            with_payload=True,
        )

        return [
            {
                "score": point.score,
                **(point.payload or {}),
            }
            for point in result.points
        ]