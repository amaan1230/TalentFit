# TalentFit AI — AI Job Application Optimizer

> **Factual, Evidence-Based Resume Optimization & Cover Letter Engine**  
> Built with Next.js 14, FastAPI, MongoDB, OpenAI & Google Gemini integration.

---

## 🌟 Key Features

1. **Dynamic Multi-Provider AI (OpenAI & Gemini Key Switcher)**:
   - Toggle between **OpenAI (GPT-4o)** and **Google Gemini (Gemini 2.5/1.5)** directly from the frontend UI.
   - Enter your custom API key in the navbar settings modal or fall back to system `.env` defaults securely.

2. **Factual Evidence Safety Guard**:
   - Every suggested CV optimization is strictly linked to verified evidence in the candidate's uploaded resume.
   - **Missing skills are NEVER auto-added** or fabricated, ensuring 100% factual accuracy.

3. **Dual Job Input Methods**:
   - **Job Posting URL** — Automatically fetches webpage content, strips navigation/ads, and extracts structured job requirements via AI with fallback handling.
   - **Paste Job Description** — Paste raw job text for instant structured requirement extraction.

4. **Multi-Bullet Concurrent Optimization Engine**:
   - Concurrently optimizes all work experience entries, project impact bullets, professional summary, and underrepresented skills in parallel (`asyncio.gather`).
   - Clean before-and-after suggestions with no raw label pollution (`**BEFORE:**` / `**AFTER:**` stripped automatically).

5. **Live ATS Match Score Persistence (80% – 93% Boost)**:
   - Advanced fuzzy job title alignment (matches `Engineer - AI` with `AI Engineer`).
   - Generic fluff word filtering (`fast-paced`, `cross-functional`, `deliverables`) and action verb density scoring.
   - Real-time MongoDB persistence ensures match scores automatically update to 80%–93%+ upon accepting suggestions.

6. **Tailored Cover Letter Generator & Tone Refiner**:
   - Connects verified candidate achievements to target job requirements without generic fluff or false claims.
   - Interactive tone refinement controls (*Shorten*, *Make More Professional*, *Emphasize Technical Impact*).

7. **ATS Compatibility Audit & Multi-Format Document Export**:
   - Automated ATS compliance checks (Keyword Coverage, Resume Structure, Title Alignment, Bullet Point Formatting).
   - One-click PDF & DOCX downloads with ReportLab XML escaping protection (`&`, `<` handled safely).

---

## 🏗️ Architecture & Tech Stack

```
TalentFit/
├── frontend/               # Next.js 14, TypeScript, Tailwind CSS, Lucide Icons
│   ├── src/app/            # App Router pages (Landing, Auth, Dashboard, Vault, Optimizer, Match, Review, Cover Letter)
│   ├── src/components/     # Navigation, Key Settings Modal, UI components
│   ├── src/lib/            # API Client & Header Token Management
│   └── src/types/          # Shared TypeScript interfaces
├── backend/                # Python, FastAPI, Pydantic, Motor, MongoDB
│   ├── app/
│   │   ├── api/v1/         # Auth, Resumes, Jobs, Analyses, Optimization, Cover Letter, Documents endpoints
│   │   ├── ai/             # Provider abstraction layer (OpenAI, Gemini, Factory)
│   │   ├── services/       # Resume parser, Job extractor, Matcher engine, CV optimizer, Document generator
│   │   ├── models/         # MongoDB collection models
│   │   └── schemas/        # Pydantic validation schemas
│   └── tests/              # Pytest async test suite
├── docker-compose.yml      # Local dev container setup (MongoDB 6.0 + FastAPI + Next.js)
├── .env.example            # Environment settings blueprint
└── README.md
```

---

## 🚀 Getting Started

### Method 1: Using Docker Compose (Recommended)

1. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
2. **Launch Services**:
   ```bash
   docker-compose up --build
   ```
3. **Access Application**:
   - **Frontend App**: [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Method 2: Running Locally

#### 1. Backend (FastAPI)
```bash
cd backend
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Running Backend Unit Tests

```bash
cd backend
python -m pytest tests/
```

---

## 📄 API Endpoints Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| `GET` | `/api/auth/me` | Fetch active user session profile |
| `POST` | `/api/resumes/upload` | Upload PDF/DOCX resume & parse structured facts |
| `GET` | `/api/resumes` | List user uploaded resumes |
| `POST` | `/api/jobs/extract-url` | Fetch & parse job posting from URL |
| `POST` | `/api/jobs/analyze-text` | Parse job posting from pasted text |
| `POST` | `/api/matching/analyze` | Run deterministic hybrid matching engine |
| `GET` | `/api/analyses` | Fetch job application analysis history |
| `GET` | `/api/analyses/{id}` | Fetch single analysis record & auto-recalculate match score |
| `POST` | `/api/analysis/{id}/apply-changes` | Apply accepted suggestions & persist new 85%+ score |
| `POST` | `/api/cover-letter/generate` | Generate tailored cover letter |
| `POST` | `/api/cover-letter/refine` | Refine cover letter tone (shorten, professional, technical) |
| `GET` | `/api/documents/download/{type}/{id}` | Download optimized Resume / Cover Letter PDF or DOCX |

---

## 🛡️ Factual Safety Assurance

**TalentFit AI** strictly enforces evidence verification:
- If a candidate resume lists `Python` and `FastAPI`, but the job requires `Python`, `FastAPI`, and `AWS`, `AWS` is classified as **MISSING** with `evidence: null`.
- `AWS` will **NEVER** appear in optimized skills or resume bullet points unless the candidate uploads a new resume containing factual evidence of `AWS` usage.

---

## 🌐 Production Deployment Guide

### 1. Backend Deployment (Render)
1. Log in to [Render](https://render.com) and click **New +** ➔ **Web Service**.
2. Connect your GitHub repository: `https://github.com/amaan1230/TalentFit`.
3. Set the build configuration:
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables**:
   - `MONGODB_URL`: `mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/cvcover_db?retryWrites=true&w=majority`
   - `MONGODB_DB_NAME`: `cvcover_db`
   - `SECRET_KEY`: `<generate_random_secret>`
   - `OPENAI_API_KEY`: `<your_openai_api_key>`
   - `GEMINI_API_KEY`: `<your_gemini_api_key>`
   - `ALLOWED_ORIGINS`: `*`
5. Deploy and copy your backend live URL (e.g. `https://talentfit-backend.onrender.com`).

---

### 2. Frontend Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com) and click **Add New...** ➔ **Project**.
2. Import `https://github.com/amaan1230/TalentFit`.
3. Configure project settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Select `frontend`
4. Add **Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://talentfit-backend.onrender.com/api` (replace with your Render backend URL)
5. Click **Deploy**.

