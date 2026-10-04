# AI Programming Tutor Frontend

React + Vite frontend connected to the FastAPI backend.

## Run

```bash
npm install
npm run dev
```

Create `.env` from `.env.example` if your backend URL is different:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Backend must be running on port 8000 and Qdrant must be running.

## Connected endpoints

- `POST /api/chat`
- `POST /api/documents/upload`
- `GET /api/documents`
- `POST /api/code/analyze`
- `POST /api/multimodal/analyze-image`

Practice and Progress are currently UI modules; their persistent backend APIs can be added next.
