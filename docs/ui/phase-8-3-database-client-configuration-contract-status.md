# Phase 8.3 — Database Client Configuration Contract Status

## Status

Approved contract-only phase.

## Added

- Centralized database client configuration contract.
- Server-only database env name registry.
- Forbidden `NEXT_PUBLIC_` database env registry.
- Contract-only URL/provider/schema/service-key validation.
- Release guard and evidence snapshot for database-client configuration.

## Preserved

- Memory remains the only route-bound adapter.
- Database mode remains contract-only.
- Factory still cannot create a database adapter.
- Route handlers still use dry-run memory behavior.
- No production database client, migration files, auth, payment, AI, analytics, telemetry, or persistent `/r/[publicId]` route exists.

## Validation

```text
npm run contract:database-client-config
```

Full validation:

```text
npm run validate
```
