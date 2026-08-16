# SmartFlood V3.2 Separation Report

Status: Tested

Date: 2026-08-17

## 1. Reference Architecture Discovered

The read-only reference repository at `/home/hyoukasterben/Desktop/SmartFloodV3/SmartFlood-V3` had:

- `Frontend/`: Next.js/React UI plus embedded `src/app/api` server routes.
- `Backend/`: FastAPI AI backend.
- `supabase/`: existing migration files.

The reference `Frontend/src/app/api` contained auth, RBAC, MongoDB, Supabase service-role, audit logging, emergency workflow, distribution, reports, Excel export, and AI bridge logic.

## 2. New Architecture Created

```text
Frontend/
  Next.js / React UI
  /api/* rewritten to NEXT_PUBLIC_API_URL

Backend/api/
  Next.js API compatibility layer
  Owns existing /api/* route handlers

Backend/ai/
  Existing FastAPI AI backend
```

## 3. Frontend Migrated

Copied the reference UI into `Frontend/`, then removed backend-owned route handlers and server-only helpers from the frontend:

- removed `Frontend/src/app/api`
- removed server-only database/session/workflow/report helpers from `Frontend/src/lib`
- preserved pages, components, styling, maps, services, loading/error states, pagination, QR pages, and dashboard UI

## 4. Backend Migrated

Created:

- `Backend/api`: backend-owned Next.js API compatibility app
- `Backend/ai`: preserved FastAPI AI service

`Backend/api` owns auth, RBAC, database access, workflow logic, reports, export, audit logging, and AI bridge routes.

## 5. API Routes Classified

See `docs/API_ROUTE_CLASSIFICATION.md`.

## 6. API Boundary

Existing frontend calls to `/api/*` are preserved. `Frontend/next.config.ts` forwards them to `NEXT_PUBLIC_API_URL`.

## 7. Database Boundary

MongoDB and Supabase service-role access moved to backend-owned services. No database schema, table, collection, or migration change was made.

## 8. AI Boundary

Existing FastAPI AI logic was preserved under `Backend/ai`. The backend API routes call it through `AI_BACKEND_URL`.

## 9. Authentication/RBAC Boundary

Login, logout, signed session cookies, RBAC, barangay scoping, and campaign workflow checks are owned by `Backend/api`.

Security note: authentication and authorization code is capped at Tested pending explicit human review.

## 10. Environment Variables Separated

Created:

- `Frontend/.env.example`
- `Backend/api/.env.example`
- `Backend/ai/.env.example`

No real `.env` files remain in `Frontend` or `Backend`.

## 11. CORS Configuration

`Backend/api/src/proxy.ts` applies a configurable CORS allowlist for `/api/*`, defaulting to `http://localhost:3000` with credentials enabled.

`Backend/ai` preserves its FastAPI CORS configuration through `CORS_ORIGINS`.

## 12. Files Intentionally Not Migrated Into Frontend

- embedded Next API routes
- MongoDB client
- Supabase service-role client
- server-side session cookie helpers
- server-side emergency workflow/reporting helpers
- Excel export backend code
- database credentials or service-role env values

## 13. Compatibility Layers Created

- Frontend `/api/*` rewrite to backend API
- Backend API preserves existing route paths and handler logic
- Backend API bridges AI generation/approval to `Backend/ai`

## 14. Frontend TypeScript Result

Command:

```bash
cd Frontend
npx tsc --noEmit
```

Output: command completed successfully with no output.

## 15. Frontend Build Result

Command:

```bash
cd Frontend
npm run build
```

Output excerpt:

```text
> smartflood-dashboard@1.0.0 build
> next build

▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.ts took 46ms
✓ Compiled successfully in 198ms
  Running TypeScript ...
  Finished TypeScript in 1684ms ...
✓ Generating static pages using 7 workers (6/6) in 507ms
  Finalizing page optimization ...
```

## 16. Backend Test/Build Result

Backend API TypeScript:

```bash
cd Backend/api
npx tsc --noEmit
```

Output: command completed successfully with no output.

Backend API build:

```text
> smartflood-backend-api@1.0.0 build
> next build

▲ Next.js 16.3.0 (Turbopack)
✓ Running next.config.ts took 38ms
✓ Compiled successfully in 1232ms
  Running TypeScript ...
  Finished TypeScript in 1648ms ...
✓ Generating static pages using 11 workers (29/29) in 266ms
  Finalizing page optimization ...
```

AI backend tests:

```text
....................                                                     [100%]
20 passed in 1.35s
```

## 17. Integration Verification

Runtime smoke checks:

Backend API:

```text
HTTP/1.1 200 OK
{"success":true,"message":"SmartFlood V3 API is running"}
```

Frontend proxy to backend API:

```text
HTTP/1.1 200 OK
{"success":true,"message":"SmartFlood V3 API is running"}
```

AI service startup:

```text
Application startup complete.
Uvicorn running on http://0.0.0.0:8000
```

AI health curl from a separate shell could not connect in this sandbox even after successful Uvicorn startup. The AI service logic is covered by the passing pytest suite above.

Live credential-backed flows not executed here:

- login with real users
- RBAC role review
- sensor data load
- flood maps with live MongoDB data
- emergency relief lifecycle with real Supabase data
- QR verification
- Excel export content validation

Those require real `.env` credentials and human security review.

## 18. Remaining Manual Steps

- Fill backend `.env` files with real secrets outside git.
- Run browser-based login/RBAC checks with test users.
- Verify live MongoDB and Supabase data paths.
- Review auth/RBAC behavior before promotion beyond Tested.
- Review `npm audit` findings for `Backend/api`; install reported two moderate vulnerabilities.

## 19. Git Commands For New Repository

```bash
git add .gitignore AGENTS.md PROJECT-INDEX.md README.md Frontend Backend docs supabase
git commit -m "Create separated SmartFlood V3.2 repository"
```
