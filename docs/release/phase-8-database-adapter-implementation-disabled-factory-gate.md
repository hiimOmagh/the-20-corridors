# Phase 8.8 — Database Adapter Implementation Behind Disabled Factory Gate

## Status

Phase 8.8 introduces the first Neon-backed database adapter implementation surface, but does not activate it for route handlers.

## Contract

Database adapter implementation exists in a server-only public-link module. Adapter maps create/read/delete/prune methods to Phase 8.5 query intents through the Phase 8.7 parameterized query descriptors.

All SQL execution remains behind explicit adapter methods. No query is executed by the guard itself except through a local fake executor used for static implementation verification. No production mutation smoke yet.

## Query-intent coverage

The implementation covers:

- `insert-public-result-record`
- `read-active-public-result-by-public-id`
- `verify-delete-token-hash-for-public-id`
- `soft-delete-public-result-by-public-id`
- `mark-expired-public-results`
- `prune-deleted-or-expired-public-results`

## Disabled activation boundary

Factory still refuses database adapter binding by default. Routes still use memory/dry-run behavior. The `/api/public-results` route files remain dry-run DTO transport and do not bind to the database adapter.

## Explicit non-goals

- No route database persistence.
- No persistent `/r/[publicId]` lookup.
- No production database mutation smoke.
- No auth/payment/AI/analytics/telemetry integration.
- No migration execution.
- No database-backed factory activation.

## Validation

The phase gate is `npm run guard:database-adapter-implementation`. The full validation chain must include this gate after Phase 8.7.
