# GenAI Resume & Job Matching Platform

A full-stack software-engineering project that analyzes a candidate resume against a job description, calculates an **explainable match score**, generates interview preparation material with Gemini, stores semantic embeddings in **PostgreSQL + pgvector**, and provides a grounded **RAG interview assistant**.

## Why this version is different

The LLM does **not** invent the match percentage. The backend calculates it deterministically from four components: skill coverage (50%), semantic similarity (25%), keyword coverage (15%), and profile completeness (10%). Gemini is used where generative models add value: interview questions, preparation plans, grounded Q&A, and resume rewriting.

## Stack

- Frontend: React, Vite, Sass, Axios
- Backend: Node.js, Express 5, Zod, JWT, Multer
- Database: PostgreSQL with normalized relational tables
- Semantic search: pgvector + Gemini embeddings (768 dimensions)
- GenAI: Google GenAI SDK / Gemini
- PDF processing: pdf-parse, OCR fallback with Tesseract, Puppeteer PDF generation
- Engineering: Helmet, rate limiting, request IDs, centralized errors, Docker Compose, GitHub Actions, OpenAPI

## Data model

The database migration creates `users`, `resumes`, `jobs`, `applications`, `skills`, `resume_skills`, `job_skills`, `analysis_results`, `interview_reports`, `document_chunks`, and `revoked_tokens`.

## Local setup

### 1. Start PostgreSQL + pgvector

```bash
docker compose up -d postgres
```

### 2. Configure the backend

```bash
cd Backend
cp .env.example .env
```

Set your Gemini API key and a strong JWT secret in `.env`.

### 3. Install, migrate, and start the backend

```bash
npm install
npm run migrate
npm run dev
```

The API runs at `http://localhost:3000`, health check at `/health`, and the OpenAPI contract at `/openapi.yaml`.

### 4. Start the frontend

```bash
cd ../Frontend
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.

## Main flow

1. Register/login.
2. Upload a PDF resume and paste a job description.
3. The app extracts resume text (OCR fallback for scanned PDFs).
4. It detects resume/JD skills and generates Gemini embeddings.
5. Application code calculates the match score and persists normalized analysis data.
6. Gemini generates technical questions, behavioral questions, and a 7-day plan without controlling the score.
7. Resume/JD text is chunked, embedded, and indexed in pgvector.
8. The RAG Assistant embeds a user question, retrieves the most relevant chunks with cosine distance, and sends only that grounded context to Gemini.

## API

All new endpoints use `/api/v1`:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/interviews`
- `GET /api/v1/interviews`
- `GET /api/v1/interviews/report/:interviewId`
- `POST /api/v1/interviews/report/:interviewId/assistant`
- `POST /api/v1/interviews/resume/pdf/:interviewReportId`

## Security and backend engineering

- HTTP-only authentication cookie
- Password hashing with bcrypt
- Revoked JWTs stored only as SHA-256 hashes
- Ownership checks on reports and resume generation
- Zod request validation
- PDF type/size validation
- Helmet security headers
- API/auth rate limits
- Request correlation IDs
- Centralized 404/error middleware
- Environment validation/fail-fast startup
- Graceful shutdown

## Testing

```bash
cd Backend
npm test

cd ../Frontend
npm run lint
npm run build
```

The GitHub Actions workflow runs backend unit tests and frontend lint/build on pushes and pull requests.

## Important migration note

This upgrade replaces MongoDB/Mongoose with PostgreSQL. Existing MongoDB user/report data is not automatically imported. For a development/demo project, start with the new PostgreSQL database. If you need old MongoDB data, write a one-off migration script rather than running both databases permanently.
