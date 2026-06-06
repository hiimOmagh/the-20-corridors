# Phase 7.4 — Backend Route Runtime Smoke Contract

## Purpose

Phase 7.4 verifies that the actual backend route files introduced in Phase 7.3 behave like the approved dry-run route helper layer at runtime.

This is still not a production persistence implementation.

## Scope

Included:

- runtime smoke check for `POST /api/public-results`
- runtime smoke check for `GET /api/public-results/[publicId]`
- runtime smoke check for `DELETE /api/public-results/[publicId]`
- verification that actual route files and route helpers stay aligned
- API route status mapping verification
- DTO-only route responses
- delete-token transport verification
- malformed request handling
- unknown public result handling
- dry-run mode response header verification
- in-memory adapter only
- Phase 7 closure criteria preparation

Excluded:

- persistent database implementation
- production storage adapter
- authentication
- payment
- AI
- analytics
- public result lookup route under `/r/[publicId]`
- raw answers or full-result transport

## Runtime status mapping

The route smoke contract expects:

| Runtime action | Expected status |
|---|---:|
| create result | 201 |
| read active result | 200 |
| delete with wrong token | 403 |
| delete with correct token | 200 |
| read deleted result | 410 |
| malformed create request | 400 |
| unknown result read | 404 |

## Transport boundary

Create responses may include the delete token exactly once because the user needs it to delete the result later.

Read responses and delete responses must not include the delete token.

Responses must remain DTO-only and must not include raw answers, private score internals, serialized full result payloads, analytics payloads, or user-identifying data.

## Implementation boundary

Phase 7.4 keeps the system on the dry-run in-memory path. Route files are real, but the persistence layer is not.

The contract must fail if route implementation introduces database clients, auth flows, payments, AI calls, analytics calls, browser persistence, raw answer transport, or full-result serialization transport.

## Phase 7 closure criteria

Phase 7 can close only when:

- backend API boundary contract passes
- backend route skeleton guard passes
- backend handler dry-run contract passes
- backend route handlers contract passes
- backend route runtime smoke contract passes
- actual API route files are limited to the approved two route files
- route files stay wired to the route helper layer
- responses remain DTO-only
- route status mapping is verified
- no raw answers or full-result transport is present
- no database, auth, payment, AI, or analytics implementation exists
