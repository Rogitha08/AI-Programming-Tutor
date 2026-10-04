from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AI Programming Tutor"
    api_prefix: str = "/api"
    frontend_origin: str = "http://localhost:5173"

    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: str | None = None
    qdrant_collection: str = "programming_tutor"

    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    llm_base_url: str
    llm_api_key: str
    llm_model: str
    vision_model: str

    top_k: int = 5
    chunk_size: int = 900
    chunk_overlap: int = 150
    max_file_size_mb: int = 25

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()