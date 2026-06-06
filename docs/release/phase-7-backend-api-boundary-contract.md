# Phase 7.0 — Backend API Boundary Contract

Phase 7.0 is a contract-only backend boundary for future public result links.
It defines create/read/delete public-result API DTOs while keeping the project free of actual API routes, database code, authentication, payment, analytics, or AI implementation.

## Scope

Allowed in this phase:

- create/read/delete public-result API DTOs
- delete-token transport rules
- expiry semantics
- abuse-control expectations
- public lookup response minimization
- evidence and tests for the boundary

Blocked in this phase:

- no actual API route in Phase 7.0
- no database implementation in Phase 7.0
- no persistent public lookup route
- no authentication, payment, AI, or analytics implementation
- no raw-answer transport
- no full result serialization transport

## API DTO boundary

Future endpoints are described, not implemented:

- `POST /api/public-results`
- `GET /api/public-results/{publicId}`
- `DELETE /api/public-results/{publicId}`

Create request accepts a minimized `PublicResultDto` only. The server-side implementation, when introduced later, must generate the public ID, delete token, delete-token hash, and default expiry.

Read responses must return a minimized DTO only for active results. Expired, deleted, or missing results return state metadata and `dto: null`.

Delete requests must provide the delete token. Read responses must never return delete tokens.

## Delete-token transport rules

- Delete token is returned only on create response.
- Delete token is required only on delete request.
- Delete token hash belongs in storage records.
- Delete token must not appear in read responses.
- Invalid delete token responses must not reveal DTO content.

## Expiry semantics

- Default expiry is 30 days.
- Expired records must not return DTO content.
- Deleted records must not return DTO content.
- Missing records must not reveal whether a user ever existed.
- Public view stays anonymous and minimized.

## Abuse-control expectations

Before any production API implementation, the project must define request validation, payload-size limits, rate limiting, safe anonymous non-sequential IDs, delete-token minimum length, and no required analytics for the core flow.
