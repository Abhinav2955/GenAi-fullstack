# AI Interview & Resume Strategist

An AI-powered full-stack platform that analyzes a candidate's resume against a target job description and generates a complete, personalized interview preparation strategy — technical & behavioral questions, skill-gap analysis, a day-wise preparation plan, and a **tailored** (not regenerated) ATS-optimized resume — all in one flow.

Built on the **MERN stack**, secured with **JWT authentication**, and powered by **Google Gemini** for structured, schema-validated AI generation.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [How It Works](#how-it-works)
- [Roadmap](#roadmap)


---

## Features

### 🔐 Authentication
- Secure registration & login with **bcrypt**-hashed passwords
- **JWT**-based session management via HTTP-only cookies
- Token blacklisting on logout to invalidate active sessions
- Protected routes with auth middleware guarding private endpoints

### 📄 Resilient Resume Parsing
- Upload any resume PDF — text-based, scanned, or design-tool exports
- **Two-stage extraction pipeline**:
  1. Fast direct text extraction for normal text-based PDFs
  2. Automatic **OCR fallback** for scanned/image-based PDFs or resumes where text was embedded as vector shapes — no user action required
- Clear, user-facing error if a file genuinely contains no readable content, instead of silently producing a broken report

### 🧠 Interview Intelligence
- Paste a target job description alongside the resume (or a quick self-description if no resume is available)
- Generates a structured **Interview Report**, schema-validated against the resume content:
  - **Match Score** — how well the candidate's profile fits the role
  - **Technical Questions** — with interviewer intention & model answers
  - **Behavioral Questions** — with interviewer intention & model answers
  - **Skill Gap Analysis** — missing skills ranked by severity
  - **Day-wise Preparation Plan** — a structured study roadmap
- All reports are persisted to MongoDB per user

### 📑 Resume Tailoring (edits, doesn't reinvent)
- The AI **edits the candidate's real resume** rather than generating a fictional one from scratch
- Real name, contact details, education, work experience, achievements, and certifications are preserved exactly — only wording, ordering, and relevance are adjusted for the target job
- Output follows a structured markdown template with optional redaction directives, then rendered to a polished, ATS-friendly PDF

### 📚 Report History
- View all previously generated interview reports
- Revisit any past report or regenerate its tailored resume PDF

### 🎨 Polished UX
- Dark-themed, responsive UI
- Real-time drag-and-drop resume upload with file-selection feedback
- Reusable animated multi-step loading screen (progress bar + live status checklist) used consistently across report generation and resume PDF generation — no blank screens during AI processing
- Clear inline validation and error handling throughout

---

## Tech Stack

**Frontend**
- React (Vite)
- React Router
- SCSS (feature-scoped stylesheets)
- Axios

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose
- JWT (`jsonwebtoken`) + `bcryptjs`
- `cookie-parser`, `cors`

**AI & Documents**
- Google Gemini (`@google/genai`) — structured JSON generation via response schemas (interview report) and instruction-following markdown generation (resume tailoring)
- `pdf-parse` — fast direct text extraction (first pass)
- `pdf-to-img` + `tesseract.js` — OCR fallback for scanned/image-based resumes
- `marked` — converts the AI's tailored-resume markdown into HTML
- `puppeteer` — HTML-to-PDF rendering for generated resumes

---

## Project Architecture

```
┌─────────────┐        REST API (JWT cookie auth)        ┌──────────────┐
│   React     │  ───────────────────────────────────────▶│   Express    │
│  (Vite SPA) │◀───────────────────────────────────────── │   Backend    │
└─────────────┘                                            └──────┬───────┘
                                                                    │
                    ┌───────────────────┬───────────────────────────┼───────────────────────────┐
                    ▼                   ▼                           ▼                           ▼
              ┌───────────┐     ┌───────────────┐            ┌───────────────┐          ┌──────────────┐
              │ MongoDB   │     │ pdf-parse /   │            │ Google Gemini │          │  Puppeteer    │
              │ (Mongoose)│     │ Tesseract OCR │            │ (AI Service)  │          │ (PDF Render)  │
              └───────────┘     └───────────────┘            └───────────────┘          └──────────────┘
```

---

## Folder Structure

```
GenAi-fullstack/
├── Backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js              # MongoDB connection setup
│   │   ├── controllers/
│   │   │   ├── auth.controller.js       # Register, login, logout, get-me
│   │   │   └── interview.controller.js  # Report generation & retrieval
│   │   ├── middlewares/
│   │   │   ├── auth.middleware.js       # JWT verification & blacklist check
│   │   │   └── file.middleware.js       # Multer resume upload handling
│   │   ├── models/
│   │   │   ├── blacklist.model.js       # Invalidated JWTs (post-logout)
│   │   │   ├── interviewReport.model.js # Interview report schema
│   │   │   └── user.model.js            # User schema
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── interview.routes.js
│   │   ├── services/
│   │   │   ├── ai.service.js            # Gemini prompt orchestration + resume markdown → PDF
│   │   │   └── pdfExtraction.service.js # Text extraction with automatic OCR fallback
│   │   └── app.js                       # Express app configuration
│   ├── .env
│   ├── package.json
│   └── server.js                        # Entry point
│
└── Frontend/
    ├── src/
    │   ├── features/
    │   │   ├── auth/
    │   │   │   ├── components/          # Protected route wrapper
    │   │   │   ├── hooks/               # useAuth
    │   │   │   ├── pages/               # Login, Register
    │   │   │   ├── services/            # auth.api.js
    │   │   │   └── auth.context.jsx
    │   │   └── interview/
    │   │       ├── components/          # Shared LoadingScreen
    │   │       ├── hooks/               # useInterview
    │   │       ├── pages/               # Home, Interview
    │   │       ├── services/            # interview.api.js
    │   │       ├── style/               # home.scss, interview.scss
    │   │       └── interview.context.jsx
    │   ├── style/                       # Global/shared styles (button.scss)
    │   ├── App.jsx
    │   ├── app.routes.jsx
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- MongoDB (local instance or Atlas)
- A Google Gemini API key

### 1. Clone the repository
```bash
git clone https://github.com/Abhinav2955/GenAi-fullstack.git
cd GenAi-fullstack
```

### 2. Backend setup
```bash
cd Backend
npm install
```
Create a `.env` file in `Backend/` (see [Environment Variables](#environment-variables)), then start the server:
```bash
npm run dev
```
The backend runs on `http://localhost:3000` by default.

### 3. Frontend setup
```bash
cd Frontend
npm install
npm run dev
```
The frontend runs on `http://localhost:5173` by default.

---

## Environment Variables

Create a `.env` file inside `Backend/`:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GOOGLE_GENAI_API_KEY=your_google_genai_api_key
```

---

## API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint         | Description                          | Access  |
|--------|------------------|---------------------------------------|---------|
| POST   | `/register`      | Register a new user                   | Public  |
| POST   | `/login`         | Log in and receive a session cookie   | Public  |
| POST   | `/logout`        | Log out and blacklist the active JWT  | Private |
| GET    | `/get-me`        | Get the currently authenticated user  | Private |

### Interview Routes — `/api/interview`

| Method | Endpoint                        | Description                                              | Access  |
|--------|----------------------------------|-------------------------------------------------------------|---------|
| POST   | `/`                              | Generate an interview report (resume + job description)     | Private |
| GET    | `/`                              | Get all interview reports for the logged-in user             | Private |
| GET    | `/report/:interviewId`           | Get a single interview report by ID                          | Private |
| POST   | `/resume/pdf/:interviewReportId` | Generate a tailored resume PDF for a given report             | Private |

> All private routes require a valid JWT sent via HTTP-only cookie.

---

## How It Works

1. **User authenticates** — registers or logs in; the backend issues a JWT stored in an HTTP-only cookie.
2. **User submits a job description + resume (or self-description)** through the Home page.
3. **Backend extracts resume text**:
   - Attempts fast direct extraction via `pdf-parse`.
   - If that yields too little text (indicating a scanned or image-based PDF), automatically falls back to rendering each page as an image and running OCR.
   - If neither method produces usable text, the request fails early with a clear, user-facing error instead of silently generating a broken report.
4. **Resume, self-description, and job description are sent to Gemini** with a strict JSON response schema to generate the interview report.
5. **Gemini returns a structured report** — match score, technical/behavioral questions, skill gaps, and a preparation plan — which is validated and persisted in MongoDB.
6. **User can request a tailored resume PDF**:
   - Gemini is instructed to **edit** the original extracted resume text — preserving real name, contact details, education, experience, achievements, and certifications exactly — only adjusting wording/relevance for the target job and removing clearly irrelevant content.
   - The AI's output follows a strict markdown template (with optional redaction directives for hiding personal details); the backend parses it, converts it to styled HTML, and renders it to PDF.
7. **All reports are saved** to the user's account and accessible anytime from their report history.

---

## Roadmap

- [ ] DOCX resume upload support
- [ ] Mock interview mode with real-time AI feedback
- [ ] Export interview report as PDF
- [ ] Email verification on registration
- [ ] Rate limiting on AI generation endpoints

---

## Author

**Abhinav Prasad**
B.Tech, Computer Science & Information Technology — Institute of Engineering and Management (IEM), Kolkata