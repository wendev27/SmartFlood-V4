# API Route Classification

Status: Tested

Date: 2026-08-17

All routes listed below were inspected from the reference `Frontend/src/app/api` and are now hosted in `Backend/api/src/app/api` unless noted otherwise. Frontend calls are preserved through `/api/*` rewrites to `NEXT_PUBLIC_API_URL`.

| Route | Methods | Classification | V3.2 Owner |
| --- | --- | --- | --- |
| `/api/health` | GET | frontend BFF/proxy | Backend API |
| `/api/auth/login` | POST | authentication endpoint | Backend API |
| `/api/auth/logout` | POST | authentication endpoint | Backend API |
| `/api/sensors/latest` | GET | database endpoint | Backend API |
| `/api/sensors/history` | GET | database endpoint | Backend API |
| `/api/sensors/simulate` | POST | database endpoint | Backend API |
| `/api/families` | GET | database endpoint | Backend API |
| `/api/residents` | GET, POST | backend business logic | Backend API |
| `/api/residents/[id]` | PATCH, DELETE | backend business logic | Backend API |
| `/api/resident-applications` | GET, POST | backend business logic | Backend API |
| `/api/resident-applications/[id]/review` | PATCH | backend business logic | Backend API |
| `/api/app-users` | GET, POST | authentication/RBAC endpoint | Backend API |
| `/api/app-users/[id]` | PATCH | authentication/RBAC endpoint | Backend API |
| `/api/app-users/[id]/password` | PATCH | authentication/RBAC endpoint | Backend API |
| `/api/app-users/[id]/status` | PATCH | authentication/RBAC endpoint | Backend API |
| `/api/logs` | GET, POST | audit/database endpoint | Backend API |
| `/api/relief/inventory` | GET, POST | backend business logic | Backend API |
| `/api/ai/recommendations` | GET | database endpoint | Backend API |
| `/api/ai/recommendations/generate` | POST | frontend BFF/proxy to AI | Backend API -> Backend AI |
| `/api/ai/recommendations/approve` | POST | backend business logic plus AI proxy | Backend API -> Backend AI |
| `/api/ai/recommendations/reject` | POST | backend business logic | Backend API |
| `/api/emergency/allocation/current` | GET | backend business logic | Backend API |
| `/api/emergency/allocations/[batchId]/notify-barangays` | POST | backend business logic | Backend API |
| `/api/emergency/allocation-items/[itemId]/accept` | POST | backend business logic | Backend API |
| `/api/emergency/allocation-items/[itemId]/reject` | POST | backend business logic | Backend API |
| `/api/emergency/allocation-items/[itemId]/confirm-receipt` | POST | backend business logic | Backend API |
| `/api/emergency/allocation-items/[itemId]/notify-family-heads` | POST | backend business logic | Backend API |
| `/api/emergency/campaigns/history` | GET | backend business logic | Backend API |
| `/api/emergency/campaigns/[batchId]/start` | POST | backend business logic | Backend API |
| `/api/emergency/campaigns/[batchId]/close` | POST | backend business logic | Backend API |
| `/api/emergency/notifications` | GET | backend business logic | Backend API |
| `/api/emergency/notifications/[notificationId]/read` | PATCH | backend business logic | Backend API |
| `/api/emergency/distribution/verify` | POST | backend business logic | Backend API |
| `/api/emergency/distribution/confirm` | POST | backend business logic | Backend API |
| `/api/emergency/distribution/history` | GET | backend business logic | Backend API |
| `/api/emergency/distribution/report` | GET | reporting/export endpoint | Backend API |
| `/api/emergency/distribution/export` | GET | reporting/export endpoint | Backend API |
| `/api/emergency/distribution/not-received` | GET | reporting/export endpoint | Backend API |
| `/api/emergency/distribution/beneficiary-status` | GET | reporting/export endpoint | Backend API |

## Compatibility Layer

The compatibility layer is `Frontend/next.config.ts`. It preserves existing UI calls to relative `/api/*` paths and forwards them to the backend API base URL.

No endpoint path, HTTP method, request field, response field, or pagination parameter was intentionally renamed during the separation.
