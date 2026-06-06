# Phase 7.3 — Backend Route Files with Dry-Run Handlers

## Scope

Phase 7.3 introduces the first actual Next.js API route files for the public-result link lifecycle. These routes are intentionally limited to dry-run handler functions and the in-memory adapter.

## Implemented route files

- `src/app/api/public-results/route.ts`
  - `POST /api/public-results`
- `src/app/api/public-results/[publicId]/route.ts`
  - `GET /api/public-results/{publicId}`
  - `DELETE /api/public-results/{publicId}`

## Handler boundary

The route files must call dry-run handler functions through the route-helper layer only:

- `handlePublicResultCreateRouteBody`
- `handlePublicResultReadRoute`
- `handlePublicResultDeleteRouteBody`

The route helpers use the in-memory adapter only only. There is still no durable database, no production storage adapter, and no persistent public-result lookup page.

## Allowed behavior

- Parse public API request DTO JSON.
- Return DTO-safe responses.
- Map create/read/delete results to HTTP-like status codes.
- Return delete token only on create responses.
- Hide DTOs for expired or deleted reads.
- Keep route responses `Cache-Control: no-store`.

## Blocked behavior

- no database, auth, payment, AI, or analytics
- no raw answers or full result transport
- no full serialized result export
- no persistent public lookup route
- no external network calls
- no production storage adapter

## Acceptance

Phase 7.3 is accepted when:

- the two approved actual Next.js route files exist;
- route files export only POST, GET, and DELETE as planned;
- route files are wired to dry-run handler functions;
- create/read/delete dry-run route flow passes;
- invalid delete-token behavior returns a DTO-safe response;
- DTO-only response boundaries pass;
- blocked backend/database/auth/payment/AI/analytics signals are absent.
