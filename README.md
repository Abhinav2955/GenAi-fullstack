# GenAI Resume

A full-stack AI-powered resume analysis and interview preparation platform that compares a candidate's resume with a job description, calculates an explainable match score, identifies skill gaps, generates personalized interview preparation content, and provides a Retrieval-Augmented Generation (RAG) assistant grounded in the candidate's resume and target role.

## Live Demo

**[Open Resume strategist](https://genai-resume-1-rqk0.onrender.com)**

---

## Features

- Resume PDF upload and text extraction
- Resume and job description analysis
- Explainable resume-job match scoring
- Matched and missing skill detection
- Semantic similarity using vector embeddings
- RAG-based interview assistant
- Technical and behavioral interview question generation
- Personalized 7-day interview preparation roadmap
- Job-targeted resume generation
- PDF resume generation and download
- User authentication and protected routes
- PostgreSQL vector storage using pgvector
- Automated unit and API integration testing
- Dockerized backend
- Full CI/CD pipeline using GitHub Actions
- Automated production deployment

---

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
- Puppeteer

### Database

- PostgreSQL
- pgvector
- Neon PostgreSQL

### AI

- Google Gemini
- Vector Embeddings
- Retrieval-Augmented Generation (RAG)
- Semantic Search
- Cosine Similarity

### DevOps & Deployment

- Docker
- GitHub Actions
- Render
- CI/CD
- Git
- GitHub

### Testing

- Node.js Test Runner
- Unit Testing
- API Integration Testing

---

## System Architecture

```text
                     ┌─────────────────────┐
                     │    React Frontend   │
                     │        Vite         │
                     └──────────┬──────────┘
                                │
                            REST API
                                │
                                ▼
                     ┌─────────────────────┐
                     │ Node.js + Express   │
                     │      Backend        │
                     └──────────┬──────────┘
                                │
                  ┌─────────────┴─────────────┐
                  │                           │
                  ▼                           ▼
        ┌──────────────────┐        ┌──────────────────┐
        │   PostgreSQL     │        │  Google Gemini   │
        │   + pgvector     │        │       API        │
        └──────────────────┘        └──────────────────┘
```

The React frontend communicates with a versioned Express REST API.

The backend handles authentication, resume processing, matching logic, RAG retrieval, AI generation, database operations, and PDF generation.

---

## Resume Analysis

The application analyzes a candidate's resume against a target job description.

The analysis identifies:

- Matched technical skills
- Missing technical skills
- Keyword overlap
- Semantic similarity
- Resume profile completeness

These signals are combined to produce an explainable resume-job match score.

---

## Explainable Match Score

The match score is calculated by deterministic application logic rather than asking an LLM to generate an arbitrary percentage.

| Component | Weight |
|---|---:|
| Skill Coverage | 50% |
| Semantic Similarity | 25% |
| Keyword Coverage | 15% |
| Profile Completeness | 10% |

### Skill Coverage

Technical skills are extracted from both the resume and job description.

```text
Job Description Skills
          │
          ├──── Present in Resume ────► Matched Skills
          │
          └──── Not Present ──────────► Missing Skills
```

Skill aliases are normalized so variations such as:

```text
Node.js
NodeJS
Node JS
```

can be recognized as the same skill.

The extraction logic also uses phrase boundaries to reduce false-positive skill matches.

### Semantic Similarity

Resume and job-description content is converted into numerical vector embeddings.

Cosine similarity is then used to measure semantic similarity between the vectors.

```text
Resume
   │
   ▼
Embedding ──────┐
                │
                ▼
         Cosine Similarity
                ▲
                │
Embedding ──────┘
   ▲
   │
Job Description
```

If embeddings are temporarily unavailable, the matching system can fall back to lexical similarity.

---

## Retrieval-Augmented Generation

The application includes a RAG-based assistant for candidate-specific interview preparation.

Instead of relying only on the LLM's general knowledge, relevant information is retrieved from the candidate's resume and target job description before an answer is generated.

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
          │        User Question
          │              │
          │              ▼
          │        Query Embedding
          │              │
          └──────────────┤
                         ▼
                 Vector Similarity
                       Search
                         │
                         ▼
                 Relevant Context
                         │
                         ▼
                   Google Gemini
                         │
                         ▼
                  Grounded Answer
```

### RAG Flow

1. Resume and job-description text is divided into chunks.
2. Embeddings are generated for the chunks.
3. Embeddings are stored using PostgreSQL and pgvector.
4. The user's question is converted into an embedding.
5. Vector similarity search retrieves relevant chunks.
6. Retrieved context is supplied to Gemini.
7. Gemini generates a grounded response.

The assistant is instructed not to invent candidate skills, projects, qualifications, experience, or achievements that are unsupported by the provided context.

---

## Interview Preparation

The application generates personalized interview preparation content according to the candidate's resume and target role.

This includes:

- Technical interview questions
- Behavioral interview questions
- Question intentions
- Suggested answers
- Skill-gap analysis
- Personalized preparation tasks
- 7-day interview preparation roadmap

The RAG assistant can then answer follow-up questions such as:

```text
Which missing skills should I prioritize?
```

```text
Which of my projects are most relevant to this job?
```

```text
What technical topics should I prepare for this role?
```

---

## Resume Generation

The platform can generate a job-targeted version of the candidate's existing resume.

Candidate information is preserved while relevant content can be reorganized and reworded according to the target job description.

```text
Existing Resume
      +
Job Description
      │
      ▼
Google Gemini
      │
      ▼
Tailored Resume Content
      │
      ▼
Markdown / HTML
      │
      ▼
Puppeteer + Chromium
      │
      ▼
Resume PDF
```

Puppeteer uses Chromium inside the production Docker container to render the generated resume as a downloadable PDF.

---

## Backend Architecture

The backend follows a layered architecture that separates HTTP handling from application logic.

```text
Routes
   │
   ▼
Middleware
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
   ├── RAG Retrieval
   └── Resume Generation
   │
   ▼
PostgreSQL + pgvector
```

The REST API is versioned under:

```text
/api/v1
```

---

## Authentication & Security

The application includes:

- JWT authentication
- HTTP-only authentication cookies
- Password hashing
- Protected API routes
- Resource ownership validation
- Zod request validation
- API rate limiting
- Helmet security headers
- Centralized error handling
- Request IDs for request tracing
- Environment configuration validation

Sensitive production credentials are managed through environment variables and deployment secrets.

---

## Reliability & Error Handling

External AI APIs may occasionally become unavailable or rate-limited.

The backend includes retry handling with exponential backoff for temporary Gemini failures such as:

```text
429 - Too Many Requests
503 - Service Unavailable
```

This prevents temporary external API failures from immediately causing application requests to fail.

The matching system also supports lexical fallback when semantic embeddings are temporarily unavailable.

---

## Database

PostgreSQL stores the application's relational data.

pgvector extends PostgreSQL with vector storage and similarity-search capabilities required by the RAG pipeline.

```text
              PostgreSQL
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
 Relational Data      Vector Embeddings
                            │
                            ▼
                         pgvector
```

The production PostgreSQL database is hosted using Neon.

---

## Docker

The backend is containerized using Docker.

The production Docker environment includes:

- Node.js runtime
- Express backend
- Production dependencies
- Chromium
- Puppeteer runtime requirements

```text
Backend Source
      │
      ▼
Docker Build
      │
      ▼
Backend Image
      │
      ▼
Production Container
```

Docker provides a reproducible runtime environment and prevents environment-specific configuration differences between development and production.

---

## Automated Testing

The project includes automated tests for both core application logic and API behavior.

### Unit Tests

Tests cover:

- Skill extraction
- Skill aliases
- REST API aliases
- Node.js aliases
- GenAI/RAG-related skills
- False-positive prevention
- Matched and missing skills
- Keyword scoring
- Cosine similarity
- Semantic fallback
- Profile completeness
- Match-score boundaries

### API Integration Tests

Tests cover:

- Health endpoint
- Request validation
- Authentication protection
- Security headers
- Request tracing
- Malformed requests
- Error handling
- Unknown routes

Run backend tests with:

```bash
cd Backend
npm test
```

---

## CI/CD Pipeline

The project includes an end-to-end CI/CD pipeline implemented using GitHub Actions.

Every push to the `main` branch automatically triggers the pipeline.

```text
                     Push to main
                          │
                          ▼
                    GitHub Actions
                          │
              ┌───────────┼───────────┐
              │           │           │
              ▼           ▼           ▼
          Backend      Frontend     Docker
           Tests        Build        Build
              │           │           │
              └───────────┼───────────┘
                          │
                    All Checks Pass
                          │
                          ▼
                Production DB Migration
                          │
                          ▼
                    Deploy Backend
                          │
                          ▼
                 Backend Health Check
                          │
                          ▼
                    Deploy Frontend
                          │
                          ▼
               Frontend Availability
                          │
                          ▼
                    Production Live
```

The pipeline performs:

- Backend dependency installation
- Automated backend tests
- Frontend production build validation
- Backend Docker image build validation
- Production database migration
- Automatic backend deployment
- Backend health verification
- Automatic frontend deployment
- Frontend availability verification

Production deployment occurs only after the required CI checks pass.

---

## Production Infrastructure

```text
GitHub Repository
       │
       ▼
GitHub Actions
       │
       │
       ├─────────────────────────────┐
       │                             │
       ▼                             ▼
Render Backend                 Render Frontend
Web Service                    Static Site
       │
       │
       ▼
Docker Container
       │
       ▼
Neon PostgreSQL
       │
       ▼
pgvector
```

### Hosting

**Frontend:** Render Static Site

**Backend:** Render Web Service

**Database:** Neon PostgreSQL + pgvector

**CI/CD:** GitHub Actions

---

## Local Development

### Prerequisites

- Node.js
- npm
- PostgreSQL
- Git

### Backend

```bash
cd Backend
npm install
npm run migrate
npm run dev
```

### Frontend

Open another terminal:

```bash
cd Frontend
npm install
npm run dev
```

---

## Project Structure

```text
genAi-resume/
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml
│
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── db/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── services/
│   │   └── app.js
│   │
│   ├── tests/
│   ├── .dockerignore
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
│
├── Frontend/
│   ├── src/
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   └── interview/
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
└── README.md
```

---

## Key Engineering Concepts

The project demonstrates practical implementation of:

- Full-stack web development
- REST API design
- Authentication and authorization
- Relational database integration
- Vector embeddings
- Semantic similarity
- Retrieval-Augmented Generation
- LLM integration
- Explainable scoring
- PDF processing and generation
- API reliability and error handling
- Automated unit testing
- API integration testing
- Docker containerization
- Continuous Integration
- Continuous Deployment
- Production database migration
- Automated deployment verification

---

## Author

**Abhinav Prasad**

B.Tech - Computer Science & Information Technology  
Institute of Engineering & Management, Kolkata