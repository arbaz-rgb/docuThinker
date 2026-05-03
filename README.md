# DocuThinker

DocuThinker is a full-stack document intelligence app for uploading documents, extracting text, generating AI study outputs, chatting with documents, and exporting summaries.

The project is prepared for:

- Frontend: Vercel
- Backend API: Render
- AI/ML analysis service: Render

Deployment is not automatic from this repository. Configure environment variables in Vercel and Render before deploying.

## Features

- User registration, login, JWT authentication, and protected app routes
- Document upload with server-side validation and text extraction
- Dashboard, document details, search, and delete workflows
- AI summary generation and key insights
- Ask PDF chat for document-grounded Q&A
- Interview Mode for likely questions, answer points, follow-ups, and revision topics
- Exam Mode for MCQs, short answers, long answers, and revision notes
- Summary export as PDF or TXT
- Light/dark theme support

## Architecture

```text
DocuThinker
|-- frontend/                 React + Vite app for Vercel
|   |-- src/pages             Dashboard, upload, details, Ask PDF, study modes, auth
|   |-- src/components        Layout and shared UI components
|   |-- src/services          Axios API clients
|   |-- src/routes            Public/protected route configuration
|   `-- vercel.json           Vercel SPA deployment config
|-- backend/                  Express API for Render
|   |-- src/controllers       Request handlers
|   |-- src/routes            API route modules
|   |-- src/models            Mongoose models
|   |-- src/services          OpenAI, export, and analysis services
|   |-- src/middleware        Auth, upload, and error middleware
|   `-- ai_ml/                FastAPI AI/ML service for Render
`-- render.yaml               Render Blueprint for backend and AI/ML services
```

## Runtime Flow

1. The Vercel frontend calls the backend through `VITE_API_BASE_URL`.
2. The Render backend handles auth, uploads, MongoDB persistence, OpenAI generation, and exports.
3. The backend optionally calls the Render AI/ML service through `AI_SERVICE_URL`.
4. If `AI_SERVICE_URL` is not set, the backend falls back to local in-process analysis.

## Prerequisites

- Node.js 18 or newer
- npm
- Python 3.11 or newer for the AI/ML service
- MongoDB Atlas or another production MongoDB connection string
- OpenAI API key for AI generation features

## Local Development

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

For local development, set `NODE_ENV=development`, a local or Atlas `MONGO_URI`, and local frontend origins in `CLIENT_URLS`.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_BASE_URL` to your backend API URL, for example a local backend ending in `/api`.

### AI/ML Service

```bash
cd backend/ai_ml
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Set the backend `AI_SERVICE_URL` to this service if you want the backend to call it locally.

## Environment Variables

Use the checked-in `.env.example` files as templates. Do not commit real `.env` files or secrets.

### Frontend

File: `frontend/.env.example`

| Variable | Required | Description | Production example |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | Yes | Backend API base URL. Must include `/api`. | `https://your-docuthinker-backend.onrender.com/api` |

### Backend

File: `backend/.env.example`

| Variable | Required | Description | Production example |
| --- | --- | --- | --- |
| `PORT` | Render sets this | HTTP port | `10000` |
| `NODE_ENV` | Yes | Runtime environment | `production` |
| `MONGO_URI` | Yes | MongoDB connection string | `mongodb+srv://USER:PASSWORD@CLUSTER.mongodb.net/docuthinker` |
| `CLIENT_URLS` | Yes | Comma-separated allowed frontend origins for CORS | `https://your-docuthinker-frontend.vercel.app` |
| `JWT_SECRET` | Yes | Long random JWT signing secret | `replace_with_a_long_random_secret` |
| `JWT_EXPIRES_IN` | No | JWT lifetime | `7d` |
| `AI_SERVICE_URL` | No | AI/ML service URL | `https://your-docuthinker-ai.onrender.com` |
| `AI_SERVICE_TIMEOUT_MS` | No | AI/ML request timeout | `15000` |
| `OPENAI_API_KEY` | Yes | OpenAI API key | `sk-...` |
| `OPENAI_MODEL` | No | OpenAI model override | `gpt-4.1-mini` |
| `OPENAI_TIMEOUT_MS` | No | OpenAI request timeout | `30000` |

### AI/ML

File: `backend/ai_ml/.env.example`

| Variable | Required | Description | Production example |
| --- | --- | --- | --- |
| `ALLOWED_ORIGINS` | Yes | Comma-separated origins allowed by the AI/ML service | `https://your-docuthinker-backend.onrender.com` |

## Deployment Configuration

### Frontend on Vercel

Use `frontend/vercel.json`.

Recommended Vercel settings:

| Setting | Value |
| --- | --- |
| Root directory | `frontend` |
| Framework preset | Vite |
| Install command | `npm ci` |
| Build command | `npm run build` |
| Output directory | `dist` |

Required Vercel environment variable:

```text
VITE_API_BASE_URL=https://your-docuthinker-backend.onrender.com/api
```

The Vercel config includes an SPA rewrite so React Router routes load correctly on refresh.

### Backend on Render

Use the backend service in `render.yaml`.

Recommended Render settings:

| Setting | Value |
| --- | --- |
| Root directory | `backend` |
| Runtime | Node |
| Build command | `npm ci` |
| Start command | `npm start` |
| Health check path | `/api/health` |

Required backend environment variables:

```text
NODE_ENV=production
MONGO_URI=...
CLIENT_URLS=https://your-docuthinker-frontend.vercel.app
JWT_SECRET=...
OPENAI_API_KEY=...
```

Optional backend environment variables:

```text
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=https://your-docuthinker-ai.onrender.com
AI_SERVICE_TIMEOUT_MS=15000
OPENAI_MODEL=gpt-4.1-mini
OPENAI_TIMEOUT_MS=30000
```

### AI/ML Service on Render

Use the AI/ML service in `render.yaml`.

Recommended Render settings:

| Setting | Value |
| --- | --- |
| Root directory | `backend/ai_ml` |
| Runtime | Python |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| Health check path | `/health` |

Required AI/ML environment variable:

```text
ALLOWED_ORIGINS=https://your-docuthinker-backend.onrender.com
```

## Production Notes

- The frontend has no localhost fallback. `VITE_API_BASE_URL` must be set.
- Backend CORS is controlled by `CLIENT_URLS` / `CLIENT_URL`.
- AI/ML CORS is controlled by `ALLOWED_ORIGINS`.
- Backend AI analysis does not require the separate AI/ML service; it falls back to local analysis if `AI_SERVICE_URL` is unset.
- Uploaded files are currently stored on the backend filesystem. Render free instances have ephemeral disks, so durable production uploads require a persistent disk or object storage before real production traffic.
- Keep real secrets only in Vercel/Render environment variables.

## Verification

Run these checks before deployment.

### Frontend

```bash
cd frontend
$env:VITE_API_BASE_URL="https://your-docuthinker-backend.onrender.com/api"
npm run build
```

### Backend

```bash
cd backend
npm run build
npm start
```

### AI/ML

```bash
cd backend/ai_ml
python -m compileall app
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

## API Routes

Base URL: `/api`

### Health

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | API health check |

### Auth

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a new user |
| `POST` | `/auth/login` | Login and receive a JWT |
| `GET` | `/auth/me` | Get the current authenticated user |

### Upload

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/upload/pdf` | Upload a document using multipart field `pdf` |

### Documents

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/documents` | List authenticated user's documents |
| `GET` | `/documents/search?q=query` | Search documents |
| `GET` | `/documents/:documentId` | Get document details |
| `GET` | `/documents/:documentId/export/summary.pdf` | Download summary as PDF |
| `GET` | `/documents/:documentId/export/summary.txt` | Download summary as TXT |
| `DELETE` | `/documents/:documentId` | Delete a document |

### AI

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/ai/documents/:documentId/summary` | Generate a document summary |
| `POST` | `/ai/documents/:documentId/key-insights` | Generate key insights |
| `POST` | `/ai/documents/:documentId/ask` | Ask a question about a document |
| `POST` | `/ai/documents/:documentId/interview-mode` | Generate interview preparation |
| `POST` | `/ai/documents/:documentId/exam-mode` | Generate exam preparation |

Authenticated routes require:

```http
Authorization: Bearer <token>
```
