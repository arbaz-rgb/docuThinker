# DocuThinker

DocuThinker is a full-stack document intelligence app for uploading PDFs, extracting text, generating AI study outputs, chatting with documents, and exporting summaries. The current codebase is organized as a React/Vite frontend and an Express/MongoDB backend.

## Features

- User registration, login, JWT authentication, and protected app routes
- PDF upload with server-side validation and text extraction
- Document dashboard, details view, search, and delete support
- AI summary generation and key insights
- Ask PDF chat for document-grounded Q&A
- Interview Mode for likely questions, answer points, follow-ups, and revision topics
- Exam Mode for MCQs, short answers, long answers, and revision notes
- Summary export as PDF or TXT
- Light/dark theme support

## Architecture

```text
DocuThinker
|-- frontend/                 React 19 + Vite app
|   |-- src/pages             Dashboard, upload, details, Ask PDF, study modes, auth
|   |-- src/components        Layout and shared UI components
|   |-- src/services          Axios API clients
|   |-- src/routes            Public/protected route configuration
|   `-- src/styles            Global CSS
`-- backend/                  Express API
    |-- src/controllers       Request handlers
    |-- src/routes            API route modules
    |-- src/models            Mongoose models
    |-- src/services          OpenAI, export, and analysis services
    |-- src/middleware        Auth, upload, and error middleware
    |-- src/utils             Token and text extraction utilities
    `-- src/uploads           Uploaded PDF storage
```

The frontend talks to the backend through `VITE_API_BASE_URL`, defaulting to `http://localhost:5000/api`. The backend stores users and documents in MongoDB, extracts text from uploaded PDFs, and uses OpenAI for AI features when `OPENAI_API_KEY` is configured.

## Setup

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB running locally or a MongoDB connection string
- OpenAI API key for AI generation features

### Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Update `backend/.env` before starting the server.

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open `http://localhost:5173`.

## Environment Variables

### Backend

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | Backend port | `5000` |
| `NODE_ENV` | Runtime environment | `development` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/docuthinker` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |
| `JWT_SECRET` | Secret used to sign JWTs | `replace_with_a_strong_secret_key` |
| `JWT_EXPIRES_IN` | JWT lifetime | `7d` |
| `OPENAI_API_KEY` | OpenAI API key for AI features | `your_openai_api_key` |
| `OPENAI_MODEL` | Optional OpenAI model override | `gpt-4.1-mini` |
| `OPENAI_TIMEOUT_MS` | OpenAI request timeout | `30000` |
| `AI_SERVICE_URL` | Optional external analysis service URL | `http://127.0.0.1:8000` |
| `AI_SERVICE_TIMEOUT_MS` | External analysis service timeout | `15000` |

### Frontend

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:5000/api` |

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
| `POST` | `/upload/pdf` | Upload a PDF using multipart field `pdf` |

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

## Scripts

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm run dev
npm run build
npm run preview
```
