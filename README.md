# SmartFlood V3.3

SmartFlood V3.3 brings the SmartFlood-V3.2rey frontend presentation into the V3.2 application while preserving V3.2 APIs, services, authentication, role permissions, database usage, and AI workflows.

The frontend migration passes its automated checks. Rendered visual acceptance and authenticated end-to-end verification remain pending. See [the migration report](Frontend/MIGRATION_REPORT.md) and [the UI/API audit](Frontend/UI_PARITY_AUDIT.md) for implemented areas and unavailable capabilities.

## Structure

```text
SmartFlood-V3.3/
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

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/API_ROUTE_CLASSIFICATION.md](docs/API_ROUTE_CLASSIFICATION.md).
