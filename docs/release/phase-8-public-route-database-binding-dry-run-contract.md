# Phase 8.12 — Public Route Database Binding Dry-Run Contract

## Status

Phase 8.12 adds a fake-executor route database-binding dry-run contract. It simulates the public route create/read/delete/prune path using a database adapter injected into the existing route handler functions, but it does not activate production route persistence.

## Scope

Route database binding dry-run contract exists. Fake route-bound database adapter can execute create/read/delete/prune simulation. Actual public route handlers still use memory/dry-run behavior. No production mutation smoke. No network SQL execution. No persistent /r/[publicId] lookup yet. Phase 8.12 remains a simulation layer only.

## Explicit dry-run flag

The dry-run requires:

```text
PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN=enabled
```

The flag is accepted only in the Phase 8.12 dry-run contract path. It does not alter the production route adapter resolver.

## Preserved boundary

- Phase 8.11 preflight must remain green.
- Factory activation remains controlled.
- Public route handlers remain `next-route-files-dry-run-in-memory-only`.
- Route database binding remains disabled.
- Production mutation smoke remains blocked.
- Network query execution remains blocked.
- Persistent `/r/[publicId]` lookup remains absent.

## Validation

```bash
npm run dryrun:route-database-binding
npm run validate
npm audit --omit=dev
npm audit
npm run build
```
