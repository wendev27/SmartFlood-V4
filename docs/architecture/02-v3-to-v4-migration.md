# V3 to V4 Migration Plan

## V3 Current State

SmartFlood V3 uses a Next.js frontend/admin dashboard and a standalone FastAPI backend for AI recommendation generation.

The frontend currently handles:

- Admin dashboard UI
- Authentication API routes
- RBAC-aware Supabase reads/writes
- MongoDB sensor reads
- Audit logs
- AI generation proxying

The backend currently handles:

- AI recommendation generation
- Fuzzy flood risk computation
- AHP-inspired priority scoring
- Supabase recommendation saving
- Audit logging for AI generation

## V4 Target State

SmartFlood V4 separates responsibilities more clearly.

### Frontend

Responsible for:

- UI rendering
- Dashboard layout
- Forms
- Maps
- Tables
- Charts
- Calling backend APIs

Not responsible for:

- Direct service-role database access
- Business rules
- Sensitive RBAC decisions
- AI computation
- Password handling

### Backend

Responsible for:

- Authentication
- Authorization
- RBAC
- Barangay scoping
- Business rules
- Database access
- Sensor data access
- AI orchestration
- Audit logging
- Security event logging

### AI Engine

Responsible for:

- Fuzzy flood risk
- AHP-inspired scoring
- Recommendation explanation
- Future reinforcement learning data preparation

## Migration Priority

1. Define API contract
2. Build backend foundation
3. Move auth and RBAC logic to backend
4. Move resident/family logic to backend
5. Move sensor access to backend
6. Move AI orchestration to backend
7. Rebuild frontend as UI-only command center
8. Add street-level flood map
9. Add security events and Suricata documentation
