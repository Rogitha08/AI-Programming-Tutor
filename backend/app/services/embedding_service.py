from functools import lru_cache
from sentence_transformers import SentenceTransformer
from ..config import settings

@lru_cache(maxsize=1)
def get_model():
    return SentenceTransformer(settings.embedding_model)

class EmbeddingService:
    def encode(self, texts: list[str]) -> list[list[float]]:
        model = get_model()
        vectors = model.encode(texts, normalize_embeddings=True)
        return vectors.tolist()

    @property
    def dimension(self) -> int:
        return get_model().get_sentence_embedding_dimension()
