# AI Programming Tutor — Python Backend

## Architecture

React frontend
        |
        v
FastAPI API
  |       |        |
  |       |        +--> Multimodal Vision Service
  |       |
  |       +-----------> Code Analysis Service
  |
  +--> RAG Service
          |
          +--> Embedding Model
          |
          +--> Qdrant Vector Database
          |
          +--> LLM Service

## Features in this first backend version

- FastAPI REST API
- PDF/DOCX/TXT/source-code ingestion
- Text chunking
- Sentence-transformer embeddings
- Qdrant vector search
- RAG chat endpoint
- Image/screenshot analysis endpoint
- Code analysis endpoint
- CORS for the React frontend
- Environment-based model configuration

## Setup

### 1. Create environment

Windows:

```powershell
python -m venv .venv
.venv\Scripts\activate
```

### 2. Install packages

```powershell
pip install -r requirements.txt
```

### 3. Configure

Copy `.env.example` to `.env` and add your LLM API key.

### 4. Start Qdrant

```powershell
docker compose up -d
```

Qdrant dashboard:
http://localhost:6333/dashboard

### 5. Start FastAPI

```powershell
uvicorn app.main:app --reload
```

API:
http://127.0.0.1:8000

Swagger:
http://127.0.0.1:8000/docs

## Main endpoints

POST /api/documents/upload
POST /api/chat
POST /api/code/analyze
POST /api/multimodal/analyze-image
GET  /api/documents
GET  /api/health

## Important next upgrades

1. Connect the React frontend to these endpoints.
2. Add conversation memory.
3. Add multimodal document ingestion (PDF pages/images/diagrams).
4. Add reranking for better retrieval.
5. Add hybrid BM25 + vector retrieval.
6. Add safe code execution in an isolated Docker sandbox.
7. Add quiz generation and progress tracking.
8. Add authentication and per-user knowledge bases.
