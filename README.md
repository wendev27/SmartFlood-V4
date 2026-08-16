# SmartFlood V3.2

SmartFlood V3.2 separates the original full-stack SmartFlood application into a collaborator-friendly frontend and backend-owned API services while preserving the existing UI, endpoint paths, database usage, and AI flow.

## Structure

```text
SmartFlood-V3.2/
├── Frontend/      # Next.js / React UI, browser-safe config only
├── Backend/
│   ├── api/       # Backend-owned Next.js API compatibility layer
│   └── ai/        # Existing FastAPI AI backend
├── supabase/      # Existing non-destructive migration references
└── docs/          # Architecture and migration documentation
```

## Local Development

Frontend:

```bash
cd Frontend
npm install
npm run dev
```

Backend API:

```bash
cd Backend/api
npm install
npm run dev
```

AI backend:

```bash
cd Backend/ai
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt pytest
.venv/bin/python -m uvicorn app.main:app --reload --port 8000
```

Use `.env.example` files as templates. Do not place MongoDB credentials, Supabase service-role keys, session secrets, or production credentials in the frontend.

## Runtime Boundary

```text
Browser
  |
  v
Frontend Next.js UI
  |
  | /api/* via NEXT_PUBLIC_API_URL
  v
Backend/api Next.js route handlers
  |
  +-- MongoDB
  +-- Supabase
  +-- Backend/ai FastAPI
```

See [docs/ARCHITECTURE.md](/home/hyoukasterben/Desktop/SmartFloodV3.2/SmartFlood-V3.2/docs/ARCHITECTURE.md) and [docs/API_ROUTE_CLASSIFICATION.md](/home/hyoukasterben/Desktop/SmartFloodV3.2/SmartFlood-V3.2/docs/API_ROUTE_CLASSIFICATION.md).
