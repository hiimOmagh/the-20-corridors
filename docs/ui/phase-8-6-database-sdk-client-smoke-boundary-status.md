# Phase 8.6 Status — Database SDK Install + Client Smoke Boundary

Phase 8.6 installs and locks `@neondatabase/serverless` and adds a server-only non-network client smoke boundary.

## Approved behavior

- SDK import exists only in server-only client smoke boundary.
- Client smoke supports non-network validation first.
- Complete database env can create a smoke-only Neon query function.
- No SQL mutation is executed.
- No network query is executed.
- No database-backed adapter exists yet.
- Factory still refuses route-bound database adapter.
- Routes still use memory/dry-run behavior.

## Still blocked

- SQL execution.
- Database mutations.
- Database adapter implementation.
- Route binding to database mode.
- Persistent `/r/[publicId]` lookup route.
- Auth/payment/AI/analytics/telemetry.

## Evidence

```text
docs/evidence/database-client-smoke-boundary-latest.json
```
