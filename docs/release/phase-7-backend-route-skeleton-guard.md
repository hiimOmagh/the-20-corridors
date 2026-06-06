# Phase 7.1 — Backend Route Skeleton Guard

This contract defines the future backend route skeleton for persistent public result links while intentionally blocking request handling in Phase 7.1.

## Scope

Phase 7.1 is a guard-only milestone. It defines allowed route files, blocked request handling behavior, and future route implementation guards.

## Allowed route files

The only planned backend route files are:

- `src/app/api/public-results/route.ts`
- `src/app/api/public-results/[publicId]/route.ts`

These files are planned only. They are not created in Phase 7.1.

## Allowed methods

- `POST /api/public-results`
- `GET /api/public-results/{publicId}`
- `DELETE /api/public-results/{publicId}`

## Blocked request handling behavior

Phase 7.1 has no request handlers in Phase 7.1. It also has no database writes in Phase 7.1.

The guard blocks:

- exported `POST`, `GET`, or `DELETE` handlers
- request body parsing
- response construction
- storage adapter binding
- network transport
- auth, payment, analytics, or AI calls
- no raw-answer transport
- full-result serialization transport

## Privacy boundary

Route implementation must use the minimized public result API DTOs only. It must not transport raw answers, private score internals, evidence references, or full serialized engine results.

## Future route implementation guards

Before implementation, the next phase must include:

- body validation before create handler
- public ID validation before read handler
- delete-token validation before delete handler
- DTO-size limit before storage write
- rate-limit before production deploy
- expiry state logic before read response
- delete-token never returned on read response

This keeps Phase 7.1 as a skeleton guard, not a backend implementation.
