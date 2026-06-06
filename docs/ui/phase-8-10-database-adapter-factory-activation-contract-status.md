# Phase 8.10 Status — Database Adapter Factory Activation Contract

Phase 8.10 adds controlled non-route factory activation for the database adapter.

## User-visible behavior

No user-visible persistence behavior changes in this phase.

## Runtime behavior

- Public result API routes remain dry-run and memory-only.
- `PUBLIC_RESULT_STORAGE_MODE=database` alone cannot bind public routes.
- Route-handler context cannot create the database adapter.
- Explicit non-route activation can create the database adapter through an injected executor.
- No network query is executed.
- No production mutation smoke is allowed.

## Validation

Run `npm run contract:database-factory-activation` and then the full validation chain.
