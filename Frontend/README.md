# SmartFlood V3.2 Frontend

This is the SmartFlood React/Next.js user interface. It preserves the reference UI and calls backend APIs through `/api/*`.

## Setup

```bash
npm install
npm run dev
```

Default local frontend URL:

```text
http://localhost:3000
```

## Environment

Create `.env` from `.env.example`.

```text
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=development
```

Do not add MongoDB credentials, Supabase service-role keys, or session secrets to this frontend folder.

## API Boundary

The UI keeps its existing `/api/...` calls. `next.config.ts` rewrites those calls to `NEXT_PUBLIC_API_URL`, where `Backend/api` owns the actual route handlers.

## Validation

```bash
npx tsc --noEmit
npm run build
```
