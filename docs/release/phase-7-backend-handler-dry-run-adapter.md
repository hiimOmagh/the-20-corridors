# Phase 7.2 — Backend Route Handler Dry-Run Adapter

## Status

Phase 7.2 is a handler-logic dry-run layer only. It does not create Next.js route files and it does not expose a backend endpoint.

## Scope

This phase defines and tests handler logic functions only:

- simulate POST/GET/DELETE behavior against the in-memory adapter
- validate request/response DTOs
- verify delete-token and expiry behavior
- preserve minimized PublicResultDto only
- keep raw choices, private scoring internals, and full-result serialization out of responses

## Explicitly blocked

- no Next.js route files in Phase 7.2
- no request object parsing
- no NextResponse dependency
- no database, auth, payment, AI, or analytics
- no persistent public lookup route
- no raw-answer transport
- no full-result serialization transport

## Dry-run behavior

The dry-run adapter exercises:

1. Create with `PublicResultCreateRequestDto` and delete token.
2. Read active result from the adapter.
3. Delete attempt with wrong token.
4. Delete attempt with correct token.
5. Read after deletion with `dto: null`.
6. Expired read with `dto: null`.

The handler functions remain pure application logic. Future Next.js route files must call these handlers rather than duplicating validation or storage behavior.

## Acceptance gate

`npm run dryrun:backend-handlers` must pass and verify:

- backend route skeleton guard is still passing
- no actual API route files exist yet
- create/read/delete dry-run lifecycle passes
- invalid delete token is handled
- expired/deleted reads hide DTOs
- responses remain DTO-only
- no database/auth/payment/AI/analytics implementation is present
