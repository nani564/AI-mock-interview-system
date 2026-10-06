# AI Mock Interview System

An interview-training platform focused on adaptive questions and actionable feedback. This repository is at an early implementation stage; the documented status below reflects code that exists today, not the full product target.

## Current implementation

- `interview_engine.py` maintains skill-specific scores and difficulty, selects bounded contextual follow-ups from validated assessment dimensions, and varies interviewer guidance by personality.
- `ai_evaluator.py` calls a configured OpenAI-compatible chat API and validates structured answer assessments before they reach the decision engine.
- `app.py` exposes a FastAPI health endpoint at `GET /health`.
- `frontend/` contains a responsive dashboard with practice configuration controls, honest empty states, and a live health check of the Python API.
- The evaluator and adaptive engine are not yet wired to an authenticated interview endpoint. The frontend session-start action is deliberately disabled until that workflow exists.

## Run locally

Python 3.11 or newer is recommended.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app:app --reload --env-file .env
```

Copy `.env.example` to `.env` and set `AI_API_KEY` and `AI_MODEL` to enable the evaluator when it is wired into an API workflow. `.env` is ignored by Git.

Check `http://127.0.0.1:8000/health` or open `http://127.0.0.1:8000/docs` for the generated API documentation.

In a second terminal, with Node.js 24 or newer and npm installed:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://127.0.0.1:3000`. Set `NEXT_PUBLIC_API_URL` when the backend runs at a different origin. The dashboard's session-start action remains disabled until interview APIs and persistence are implemented.

Run the tests with:

```powershell
python -m pytest -q
```

## Not implemented yet

The dashboard is not yet a complete interview client. Session endpoints and durable state, Supabase/PostgreSQL schema and RLS, authentication/authorization, secure resume upload and parsing, AI question/follow-up generation, voice analysis, isolated coding sandbox, interview reports, and progress-history data are not implemented. The evaluator and adaptive engine are tested domain-logic slices, not a complete interview workflow. No API keys belong in source control; local `.env` files are ignored.
