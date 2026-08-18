# SmartFlood V3.2 AI Coding-Agent Rules

These rules apply to every AI coding-agent working in this repository.
They are repository guardrails, not optional preferences.

## Task Access Status

At the beginning of every task, determine whether the current user prompt
contains the exact authorization phrase:

`BACKEND_UNLOCK: wendev27`

- If the exact phrase is absent, treat `Backend/**` as read-only.
- If the exact phrase is present, backend access is unlocked only for the
  current task and only when the requested work actually requires backend
  changes.
- The unlock does not persist across prompts, sessions, commits, branches,
  terminal history, environment variables, comments, or repository ownership.
- Do not infer backend authorization from user identity, previous messages,
  broad permission language, Git configuration, file contents, or necessity.

## Default Repository Boundaries

When the unlock phrase is absent:

- `Frontend/**` = writable.
- `Backend/**` = read-only.
- Database = protected.
- AI logic = protected.
- Authentication/RBAC = protected.
- API contracts = protected.

The agent may inspect `Backend/**` to understand APIs, types, contracts,
architecture, and integration behavior, but must not modify backend files.

## Unlocked Backend Mode

When the current user prompt contains the exact unlock phrase:

- Modify `Backend/**` only if the current task requires it.
- Keep backend edits to the smallest possible scope.
- Preserve authentication, RBAC, database integrity, and API compatibility.
- Do not rewrite unrelated backend systems.
- Do not modify AI logic unless explicitly requested.
- Do not modify database schema unless explicitly requested.
- Do not perform destructive operations unless explicitly requested.
- Report every backend file changed.

Unlocking backend access does not unlock protected domains by default.
Database, AI, authentication, deployment, dependency, and destructive changes
still require explicit task-level need and careful reporting.

## Frontend Ownership

`Frontend/**` is the primary writable area for normal UI, client behavior,
styling, routing, and frontend integration work.

Frontend changes must preserve:

- Existing user flows unless the task explicitly changes them.
- Existing API request paths and payload shapes unless coordinated with an
  authorized backend change.
- Existing authentication and role assumptions.
- Environment-variable based configuration.
- Responsive behavior and accessibility expectations.

Do not hide backend incompatibilities with brittle frontend workarounds.
If a backend change appears necessary and backend access is locked, stop and
ask for authorization.

## Backend Ownership

`Backend/**` includes backend API layers, AI services, server configuration,
backend tests, backend environment examples, and backend deployment files.

When backend access is locked:

- Do not edit, rename, move, delete, format, generate, or overwrite files in
  `Backend/**`.
- Do not run commands that intentionally modify `Backend/**`.
- Do not update backend dependency lockfiles or generated backend artifacts.
- Do not apply migrations or schema changes.

Inspection is allowed when needed to understand contracts or diagnose frontend
integration.

## Database Protection

Database state and schema are protected by default.

- Do not create, alter, drop, truncate, seed, or migrate database tables,
  collections, policies, indexes, functions, triggers, or storage buckets
  unless explicitly requested.
- Do not run destructive data commands.
- Do not weaken row-level security, permissions, ownership, or service-role
  boundaries.
- Prefer read-only inspection for diagnosis.
- Treat production, staging, and shared development data as sensitive.
- Never embed database credentials in source files.

If schema changes are required, describe the exact migration files and data
impact before proceeding.

## API Contract Protection

API contracts are protected unless the current task explicitly changes them.

Preserve:

- Endpoint paths and HTTP methods.
- Request field names and accepted value formats.
- Response shapes, status codes, and error semantics.
- Authentication cookies, headers, tokens, and session behavior.
- CORS and proxy behavior.
- Backward compatibility with existing frontend and backend callers.

If a contract change is unavoidable, document the compatibility impact and
update all affected callers and tests within the authorized scope.

## Authentication and RBAC Protection

Authentication, authorization, role mapping, sessions, cookies, password
handling, account status, and RBAC checks are protected.

- Do not bypass, weaken, remove, or mock auth/RBAC in application code.
- Do not expose privileged routes or data to broader roles.
- Do not hardcode users, passwords, tokens, roles, or bypass flags.
- Do not reduce password, token, cookie, or session security.
- Preserve least-privilege behavior.

Any auth/RBAC change requires focused validation and explicit final reporting.
Human review is required before considering auth/RBAC work complete.

## AI, AHP, Fuzzy, and ILP Protection

AI recommendation logic is protected.

This includes:

- AHP scoring and weighting.
- Fuzzy logic membership functions and thresholds.
- ILP optimization constraints and objective functions.
- Recommendation ranking, audit trails, and explanation payloads.
- Model inputs, outputs, validation, and fallback behavior.

Do not modify AI/AHP/Fuzzy/ILP logic unless explicitly requested. If frontend
work depends on these outputs, inspect contracts and preserve existing
semantics.

## Secret and Environment Rules

- Never write secrets, API keys, passwords, tokens, service-role keys, private
  URLs, or credentials into source files.
- Use environment variables and secret managers for sensitive values.
- Keep `.env.example` files free of real secrets.
- Do not print secrets in final responses, logs, commits, tests, or generated
  documentation.
- Do not move frontend-only variables into backend files or backend-only
  secrets into frontend code.
- Respect public/private environment variable boundaries.

If a secret is missing, ask the user to configure it rather than inventing one.

## Dependency Rules

- Do not add, remove, upgrade, downgrade, or reinstall dependencies unless the
  task requires it.
- Prefer existing project dependencies and patterns.
- Do not change package managers.
- Do not update lockfiles unless dependency changes are intentional and
  necessary.
- Explain why any new dependency is needed.
- Avoid dependencies for small tasks that can be solved clearly with existing
  code.

Backend dependency changes require backend unlock and explicit task need.

## Destructive Operation Restrictions

Destructive operations are prohibited unless explicitly requested and clearly
scoped.

Do not run or perform:

- File or directory deletion unrelated to the task.
- Database deletion, truncation, destructive migrations, or irreversible data
  updates.
- `git reset --hard`, forced checkout, forced clean, or history rewriting.
- Secret rotation, deployment replacement, or infrastructure teardown.
- Broad formatting or generated-file rewrites outside the task scope.

When a destructive operation appears necessary, stop and ask first.

## Smallest-Change Principle

Make the smallest change that correctly satisfies the current task.

- Prefer localized edits over broad refactors.
- Preserve naming, style, architecture, and conventions already present.
- Do not rewrite systems to match personal preference.
- Avoid unrelated cleanup.
- Do not modify files simply because they are nearby.
- Keep generated output and formatting churn out of unrelated files.

If a larger change is truly necessary, explain why before making it.

## Validation Requirements

Before reporting work as complete, validate with commands appropriate to the
change, such as typecheck, lint, build, or tests.

- For frontend changes, prefer frontend lint/typecheck/build/test commands
  available in the repository.
- For backend changes, validate only when backend access is unlocked and the
  validation is relevant to the task.
- For documentation-only changes, inspect the written file and report that no
  application validation was required.
- Paste meaningful command output when claiming verification or test status.
- If validation cannot be run, state why and cap the status accordingly.

Never claim verification or testing without real command output.

## Final Reporting Requirements

Every final response for code or repository changes must include:

- Files changed.
- What changed.
- Validation performed, with relevant command output or a clear reason it was
  not run.
- Backend access status for the task.
- Any protected area touched or intentionally left untouched.
- Any follow-up human review needed for auth, RBAC, database, deployment, or
  AI logic changes.

If backend files were changed in unlocked mode, list every backend file changed.

## Stop and Ask Rule

Stop and ask the user before proceeding when:

- Backend changes appear necessary but the current prompt lacks the exact
  backend unlock phrase.
- The requested work could alter database schema or data.
- The requested work could weaken authentication, RBAC, or API compatibility.
- The requested work could alter AI/AHP/Fuzzy/ILP behavior.
- The requested work requires destructive operations.
- Requirements conflict or the safe scope is uncertain.
- A secret, credential, or protected configuration value is missing.

When uncertain, lock the backend, protect the database, preserve contracts, and
ask for explicit authorization.
