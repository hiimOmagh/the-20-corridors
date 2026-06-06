# Phase 8.7 — Database Client Query Readiness Guard

Phase 8.7 prepares the database query layer after the Neon SDK smoke boundary, without enabling production persistence.

## Scope

Parameterized query helpers are defined for the Phase 8.5 query intents:

- insert public result record
- read active public result by public ID
- verify delete-token hash for public ID
- soft-delete public result by public ID
- mark expired public results
- prune deleted or expired public results

## Guard rules

- Parameterized query helpers are defined.
- No raw string interpolation for user-controlled values is allowed.
- Insert/read/delete/expiry query helpers map to Phase 8.5 intents.
- Query helpers are server-only.
- No route binding yet.
- No adapter persistence yet.
- No mutation smoke against production DB.
- No SQL execution is performed by the readiness guard.
- No network query is performed by the readiness guard.
- The selected SDK import remains confined to the Phase 8.6 smoke boundary.
- Factory database adapter creation and route binding remain blocked.
- Routes still use memory/dry-run behavior.

## Non-goals

- No database-backed adapter.
- No route persistence.
- No production database mutation.
- No migration execution.
- No persistent `/r/[publicId]` lookup route.
- No auth, payment, AI, analytics, or telemetry implementation.

## Validation

```text
npm run guard:database-query-readiness
npm run validate
```
