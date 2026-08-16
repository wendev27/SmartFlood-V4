# SmartFlood V3.2 Backend

The backend is split into two services:

```text
Backend/
├── api/  # Next.js API compatibility layer for /api/*
└── ai/   # Existing FastAPI AI backend
```

## Backend API

```bash
cd api
npm install
npm run dev
```

Default local API URL:

```text
http://localhost:5000
```

`Backend/api` owns authentication, RBAC, MongoDB access, Supabase service-role access, emergency relief workflows, audit logging, reports, Excel export, and calls to the AI backend.

## AI Backend

```bash
cd ai
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt pytest
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Default local AI URL:

```text
http://localhost:8000
```

`Backend/ai` preserves the existing AHP, fuzzy logic, ILP, and recommendation persistence logic.

## Environment

Use `api/.env.example` and `ai/.env.example`. Never commit real credentials.

## Validation

```bash
cd api
npx tsc --noEmit
npm run build

cd ../ai
.venv/bin/python -m pytest -q
```
