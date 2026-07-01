# SmartFlood V4 API Contract

## Auth

### POST /api/auth/login

Purpose: Authenticate dashboard users.

Input:

- email
- password

Output:

- user profile
- role
- barangay scope
- session token/cookie

Reason:
Frontend should not handle password verification directly.

---

### POST /api/auth/logout

Purpose: End active session.

Input:

- active session

Output:

- success message

Reason:
Logout should clear backend session and create audit log.

---

### GET /api/me

Purpose: Return current authenticated user.

Input:

- session token/cookie

Output:

- user profile
- role
- permissions
- barangay scope

Reason:
Frontend needs a trusted source for the current viewer.

---

## Sensors

### GET /api/sensors/latest

Purpose: Get latest sensor snapshot.

Input:

- optional barangay filter
- user role/session

Process:

- validate user
- apply barangay scope
- read MongoDB sensors
- read latest sensor readings
- normalize status

Output:

- latest sensor list

Reason:
Frontend should not query MongoDB directly.

---

### GET /api/sensors/history

Purpose: Get sensor reading history.

Input:

- sensor_id
- barangay
- date range
- limit

Output:

- sensor history rows

Reason:
Flood monitoring needs historical data for reports and charts.

---

## Flood Mapping

### GET /api/flood/streets

Purpose: Return street-level flood visualization data.

Input:

- barangay
- latest sensor data

Process:

- match sensors to street segments
- calculate flood status per segment
- return colored map geometry

Output:

- street segments with risk levels

Reason:
V4 should show flooded streets, not only sensor circles.

---

## Residents

### GET /api/residents

Purpose: List residents using RBAC and barangay scope.

### POST /api/residents

Purpose: Create resident and optionally family cluster.

### PATCH /api/residents/:id

Purpose: Update resident.

### DELETE /api/residents/:id

Purpose: Soft-delete or deactivate resident.

---

## Families

### GET /api/families

Purpose: List family clusters.

### GET /api/families/:id

Purpose: View family details and members.

---

## Resident Applications

### GET /api/resident-applications

Purpose: List pending, approved, or rejected applications.

### PATCH /api/resident-applications/:id/review

Purpose: Approve or reject resident application.

---

## Relief and AI

### GET /api/relief/inventory

Purpose: Get latest relief inventory.

### POST /api/relief/inventory

Purpose: Save relief inventory update.

### GET /api/relief/recommendations

Purpose: List saved AI recommendations.

### POST /api/relief/recommendations/generate

Purpose: Generate AI relief allocation.

Input:

- inventory values
- optional barangay scope

Process:

- read sensors
- read family vulnerability data
- compute flood risk
- compute vulnerability score
- allocate inventory
- save recommendation
- save explanation
- write audit log

Output:

- recommendation rows
- fuzzy explanation
- AHP breakdown
- reasoning steps

Reason:
AI should be explainable, auditable, and reusable for future research.

---

## Account Management

### GET /api/users

Purpose: List dashboard accounts.

### POST /api/users

Purpose: Create dashboard account.

### PATCH /api/users/:id

Purpose: Update dashboard account.

### PATCH /api/users/:id/status

Purpose: Enable, disable, block, or unblock account.

### PATCH /api/users/:id/password

Purpose: Change dashboard account password.

---

## Logs

### GET /api/audit-logs

Purpose: Read role-scoped audit logs.

### GET /api/security/events

Purpose: Read security monitoring events.

### POST /api/security/events

Purpose: Store security detection event.
