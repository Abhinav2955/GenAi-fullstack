# AI Interview & Resume Strategist

An AI-powered full-stack platform that analyzes a candidate's resume against a target job description and generates a complete, personalized interview preparation strategy — technical & behavioral questions, skill-gap analysis, a day-wise preparation plan, and an ATS-optimized, AI-rewritten resume — all in one flow.

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
- [License](#license)

---

## Features

### 🔐 Authentication
- Secure registration & login with **bcrypt**-hashed passwords
- **JWT**-based session management via HTTP-only cookies
- Token blacklisting on logout to invalidate active sessions
- Protected routes with auth middleware guarding private endpoints

### 📄 Resume & Interview Intelligence
- Upload a resume (PDF) and paste a target job description
- AI extracts and parses resume content server-side (`pdf-parse`)
- Generates a structured **Interview Report** including:
  - **Match Score** — how well the candidate's profile fits the role
  - **Technical Questions** — with interviewer intention & model answers
  - **Behavioral Questions** — with interviewer intention & model answers
  - **Skill Gap Analysis** — missing skills ranked by severity
  - **Day-wise Preparation Plan** — a structured study roadmap
- All AI output is schema-validated (structured JSON generation) and persisted to MongoDB per user

### 📑 AI Resume Rewriting
- Generates a tailored, ATS-friendly resume as a polished PDF (via **Puppeteer** HTML-to-PDF rendering)
- Rewrites content to align with the specific job description while preserving the candidate's real details

### 📚 Report History
- View all previously generated interview reports
- Revisit any past report or regenerate a resume PDF from it

### 🎨 Polished UX
- Dark-themed, responsive UI
- Real-time drag-and-drop resume upload with file feedback
- Animated multi-step loading experience during AI generation (progress bar + live status checklist)
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
- Google Gemini (`@google/genai`) — structured JSON generation via response schemas
- `pdf-parse` — resume text extraction
- `puppeteer` — HTML-to-PDF rendering for generated resumes

---

## Project Architecture

```
┌─────────────┐        REST API (JWT cookie auth)        ┌──────────────┐
│   React     │  ───────────────────────────────────────▶│   Express    │
│  (Vite SPA) │◀───────────────────────────────────────── │   Backend    │
└─────────────┘                                            └──────┬───────┘
                                                                    │
                                        ┌───────────────────────────┼───────────────────────────┐
                                        ▼                           ▼                           ▼
                                  ┌───────────┐             ┌───────────────┐          ┌──────────────┐
                                  │ MongoDB   │             │ Google Gemini │          │  Puppeteer    │
                                  │ (Mongoose)│             │ (AI Service)  │          │ (PDF Render)  │
                                  └───────────┘             └───────────────┘          └──────────────┘
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
│   │   │   └── ai.service.js            # Gemini prompt orchestration + PDF generation
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
git clone https://github.com/<your-username>/GenAi-fullstack.git
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
|--------|----------------------------------|-----------------------------------------------------------|---------|
| POST   | `/`                              | Generate an interview report (resume + job description)   | Private |
| GET    | `/`                              | Get all interview reports for the logged-in user           | Private |
| GET    | `/report/:interviewId`           | Get a single interview report by ID                        | Private |
| POST   | `/resume/pdf/:interviewReportId` | Generate a tailored resume PDF for a given report           | Private |

> All private routes require a valid JWT sent via HTTP-only cookie.

---

## How It Works

1. **User authenticates** — registers or logs in; the backend issues a JWT stored in an HTTP-only cookie.
2. **User submits a job description + resume (or self-description)** through the Home page.
3. **Backend extracts resume text** using `pdf-parse`, then sends the resume, self-description, and job description to **Gemini** with a strict JSON response schema.
4. **Gemini returns a structured report** — match score, technical/behavioral questions, skill gaps, and a preparation plan — which is validated and persisted in MongoDB.
5. **User can request a tailored resume PDF** — the AI rewrites the resume content for the target role, and Puppeteer renders it into a downloadable, ATS-friendly PDF.
6. **All reports are saved** to the user's account and accessible anytime from their report history.

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