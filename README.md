# GenAI Resume

A full-stack AI-powered resume analysis and interview preparation platform that compares a candidate's resume with a job description, calculates an explainable match score, identifies skill gaps, generates personalized interview preparation content, and provides a RAG-based assistant grounded in the resume and job description.

## Features

- Resume PDF upload and text extraction
- Resume and job description analysis
- Explainable resume-job match scoring
- Automatic matched and missing skill detection
- Semantic similarity using vector embeddings
- RAG-based interview assistant
- Technical and behavioral interview question generation
- Personalized 7-day preparation roadmap
- Job-specific resume generation
- PDF resume download
- User authentication and protected routes
- PostgreSQL vector storage using pgvector
- Automated backend testing
- GitHub Actions CI pipeline

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- SCSS
- Axios
- React Router

### Backend
- Node.js
- Express.js
- REST APIs
- Zod
- JWT
- bcrypt
- Multer

### Database
- PostgreSQL
- pgvector

### AI
- Google Gemini
- Vector Embeddings
- Retrieval-Augmented Generation (RAG)
- Cosine Similarity
- Semantic Search

### DevOps & Testing
- Docker
- Docker Compose
- GitHub Actions
- Node.js Test Runner
- Git & GitHub

---

## How It Works

The application combines deterministic matching logic with semantic search and generative AI.

```text
Resume + Job Description
          │
          ▼
     Text Extraction
          │
          ├───────────────┐
          │               │
          ▼               ▼
   Skill Analysis     Embeddings
          │               │
          ▼               ▼
 Keyword Matching   Cosine Similarity
          │               │
          └───────┬───────┘
                  ▼
          Explainable Score
                  │
          ┌───────┴────────┐
          ▼                ▼
 Interview Report     RAG Assistant
```

---

## Explainable Match Score

The resume-job match score is calculated by application logic instead of being generated directly by an LLM.

| Component | Weight |
|---|---:|
| Skill Coverage | 50% |
| Semantic Similarity | 25% |
| Keyword Coverage | 15% |
| Profile Completeness | 10% |

The system extracts technical skills from both documents and determines which required skills are present or missing.

Semantic similarity is calculated using vector embeddings and cosine similarity.

If embeddings are unavailable, the application falls back to lexical similarity.

---

## RAG Assistant

The application includes a Retrieval-Augmented Generation assistant that answers questions using the candidate's resume and target job description as context.

```text
Resume + Job Description
          │
          ▼
      Text Chunks
          │
          ▼
       Embeddings
          │
          ▼
 PostgreSQL + pgvector
          │
          │
     User Question
          │
          ▼
    Query Embedding
          │
          ▼
  Similarity Search
          │
          ▼
 Relevant Context
          │
          ▼
       Gemini
          │
          ▼
   Grounded Answer
```

Instead of sending the complete document for every question, relevant chunks are retrieved using vector similarity and supplied to the model as context.

---

## Interview Preparation

Based on the resume and target role, the application generates:

- Technical interview questions
- Behavioral interview questions
- Question intentions
- Suggested answers
- Skill-gap analysis
- 7-day preparation roadmap

The RAG assistant can then answer follow-up questions such as:

> Which missing skills should I prioritize for this role?

> Which projects from my resume are most relevant to this job?

> What technical topics should I prepare before the interview?

---

## Resume Generation

The application can generate a job-targeted version of the candidate's existing resume.

It preserves factual candidate information while allowing relevant content to be reorganized and reworded according to the target job description.

The generated resume can be downloaded as a PDF.

---

## Backend Architecture

The backend follows a layered architecture:

```text
Routes
  │
  ▼
Controllers
  │
  ▼
Services
  │
  ├── AI Service
  ├── Skill Matching
  ├── PDF Extraction
  └── RAG Retrieval
  │
  ▼
PostgreSQL + pgvector
```

The REST API is versioned under:

```text
/api/v1
```

---

## Reliability & Security

The backend includes:

- JWT authentication
- HTTP-only authentication cookies
- Password hashing
- Protected API routes
- Request validation
- Rate limiting
- Helmet security headers
- Centralized error handling
- Request IDs
- Environment validation
- Gemini retry handling with exponential backoff
- Lexical fallback when embeddings are unavailable

---

## Testing

Automated tests cover the core matching logic and API behavior, including:

- Skill extraction
- Skill aliases
- False-positive prevention
- Matched and missing skills
- Keyword similarity
- Cosine similarity
- Semantic fallback
- Score boundaries
- Profile completeness
- API validation
- Authentication protection
- Security headers
- Request tracing
- Health checks
- Error handling

Run the backend tests with:

```bash
cd Backend
npm test
```

---

## Continuous Integration

GitHub Actions automatically validates the project on pushes and pull requests.

```text
Git Push / Pull Request
          │
          ▼
     GitHub Actions
       /        \
      ▼          ▼
Backend Tests  Frontend Build
   npm test     npm run build
```

---

## Running Locally

### Backend

```bash
cd Backend
npm install
npm run migrate
npm run dev
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

The frontend runs through Vite and communicates with the versioned Express REST API.

---

## Project Structure

```text
genAi-resume/
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── app.js
│   ├── tests/
│   └── server.js
│
├── Frontend/
│   └── src/
│       ├── features/
│       │   ├── auth/
│       │   └── interview/
│       ├── App.jsx
│       └── main.jsx
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── docker-compose.yml
└── README.md
```

---

## Author

**Abhinav Prasad**  
B.Tech — Computer Science & Information Technology  
Institute of Engineering & Management, Kolkata