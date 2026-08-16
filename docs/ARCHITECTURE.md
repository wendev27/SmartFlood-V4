# SmartFlood V3.2 Architecture

Status: Tested

Date: 2026-08-17

## Reference Repository

Read-only source of truth inspected for this separation:

```text
/home/hyoukasterben/Desktop/SmartFloodV3/SmartFlood-V3
```

The reference `Frontend/` was a full-stack Next.js application: React UI, Next route handlers, session cookies, RBAC checks, MongoDB access, Supabase service-role access, emergency relief workflows, reports, and Excel export all lived together.

The reference `Backend/` was a FastAPI AI service. It exposed health, AI recommendation generation/approval/listing, and relief inventory endpoints. It owns the AHP/fuzzy/ILP recommendation logic and was preserved as `Backend/ai`.

## New Runtime Boundary

```text
Browser
  |
  v
Frontend/
  Next.js and React UI
  Browser-safe env only
  /api/* calls preserved
  |
  | HTTP/HTTPS through NEXT_PUBLIC_API_URL
  v
Backend/api/
  Next.js API compatibility layer
  Auth/session/RBAC
  MongoDB access
  Supabase service-role access
  Emergency workflows
  Reports/export
  |
  +-- MongoDB
  +-- Supabase/PostgreSQL
  +-- Backend/ai FastAPI
```

## Why `Backend/api` Uses Next Route Handlers

The goal is repository separation without redesigning SmartFlood. The embedded Next API routes already define the production API contracts and contain sensitive workflow logic. Rehosting them under `Backend/api` preserves endpoint paths, response structures, cookies, RBAC behavior, and database queries with minimal risk.

The frontend no longer contains `src/app/api`. Its `next.config.ts` rewrites `/api/:path*` to `NEXT_PUBLIC_API_URL`, so existing UI services can keep calling `/api/...`.

## Frontend Ownership

`Frontend/` owns:

- dashboard, monitoring, maps, resident, verification, logs, emergency, relief, QR, and reporting UI
- client-side services and state
- frontend validation, loading states, error states, pagination, and responsive behavior
- browser-safe environment variables

`Frontend/` must not own:

- MongoDB credentials
- Supabase service-role keys
- session signing secrets
- server-side RBAC enforcement
- database mutation logic
- Excel/report generation that requires backend data access

## Backend Ownership

`Backend/api/` owns:

- existing `/api/*` contract compatibility
- login/logout/session cookies
- RBAC and barangay scoping enforcement
- MongoDB sensor endpoints
- Supabase business endpoints
- emergency relief and distribution workflows
- audit logging
- Excel export
- bridge calls to `Backend/ai`

`Backend/ai/` owns:

- AHP scoring
- fuzzy risk explanation
- ILP allocation optimization
- AI recommendation generation and approval persistence
- AI-specific audit logging

## Environment Boundary

Frontend:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NODE_ENV`

Backend API:

- `PORT`
- `CORS_ORIGINS`
- `MONGODB_URI`
- `MONGODB_DB`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SMARTFLOOD_SESSION_SECRET`
- `AI_BACKEND_URL`
- `NODE_ENV`

AI backend:

- `MONGODB_URI`
- `MONGODB_DB`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CORS_ORIGINS`

## CORS And Auth

`Backend/api/src/proxy.ts` applies a configurable CORS allowlist for `/api/*`, defaulting to `http://localhost:3000` with credentials enabled.

The preferred local browser flow is still same-origin from the browser's perspective:

```text
Browser -> Frontend /api/* -> Backend/api /api/*
```

That keeps existing cookie behavior safer than requiring the browser to manage cross-site cookies directly. Production deployments should use same-site domains or a reverse proxy whenever possible.

Authentication/RBAC is preserved from the copied route handlers, but because auth and authorization are security-sensitive, promotion beyond Tested requires explicit human review.

## Deployment Notes

Recommended deployment units:

- `Frontend/`: Next.js web app, port 3000 locally
- `Backend/api/`: Next.js API app, port 5000 locally
- `Backend/ai/`: FastAPI app, port 8000 locally

Set `Frontend/.env` `NEXT_PUBLIC_API_URL` to the deployed `Backend/api` base URL. Set `Backend/api/.env` `AI_BACKEND_URL` to the deployed `Backend/ai` base URL.

## Files Intentionally Not Moved Into Frontend

- `Frontend/src/app/api` from the reference repository
- server-only database clients
- server-side audit logger
- server-side emergency workflow/reporting helpers
- server-side session cookie helpers
- MongoDB and Supabase service-role env examples

## Validation Snapshot

Last validation was run against this new V3.2 repository only, not the reference repository.

See the final task report for pasted command output.
