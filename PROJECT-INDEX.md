# PROJECT-INDEX.md

Generated once per project, re-read every session instead of re-scanning
the repo. Regenerate manually when the stack changes materially.

## Project
- Name: SmartFlood V3.2
- Type: separated full-stack web application

## Stack
- Languages: TypeScript, Python
- Frontend: Next.js 16.3, React 19.2
- Backend API compatibility layer: Next.js 16.3 route handlers
- AI backend: FastAPI
- Databases: existing MongoDB and Supabase/PostgreSQL
- Package managers: npm, pip
- Test framework: pytest for `Backend/ai`

## Entry Points
- Frontend UI: `Frontend/src/app`
- Frontend API boundary: `Frontend/next.config.ts` rewrites `/api/*` to `NEXT_PUBLIC_API_URL`
- Backend API routes: `Backend/api/src/app/api`
- Backend API CORS proxy: `Backend/api/src/proxy.ts`
- AI backend: `Backend/ai/app/main.py`
- Supabase migrations reference: `supabase/migrations`
- Environment examples: `Frontend/.env.example`, `Backend/api/.env.example`, `Backend/ai/.env.example`

## Conventions Observed
- Preserve existing endpoint paths, request fields, response shapes, auth cookies, RBAC checks, and database collections/tables.
- Do not hardcode production URLs or secrets.
- Frontend collaborators should not need backend-only credentials.
- The reference repository is read-only: `/home/hyoukasterben/Desktop/SmartFloodV3/SmartFlood-V3`.
- Authentication and RBAC changes are capped at Tested until human review.

## Active Skills
- None loaded. `skills/index.md` is not present in this repository.

## Last Verified
- Date generated/updated: 2026-08-17
- By: Codex
