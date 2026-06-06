# Phase 8.1 — Database Adapter Runtime Selection Guard

## Purpose

Phase 8.1 adds a runtime-selection guard for public-result persistence without adding a production database client. It prevents accidental persistence-mode activation while preserving the existing Phase 7.3 route behavior.

## Runtime mode contract

The only accepted mode selector is:

```text
PUBLIC_RESULT_STORAGE_MODE=memory
PUBLIC_RESULT_STORAGE_MODE=database
```

Unset mode is treated as `memory`.

## Memory mode

Memory mode is the default route behavior. It selects the in-memory public-result storage adapter and preserves the existing dry-run backend route implementation.

Required properties:

- route handlers remain dry-run in-memory
- no production database client
- no migrations
- no hosted persistence
- no public lookup route `/r/[publicId]`
- DTO-only response behavior remains unchanged

## Database mode

Database mode is contract-only in Phase 8.1. It can be recognized as explicitly configured, but it cannot bind route handlers to a database adapter yet.

Required server-only environment contract:

```text
PUBLIC_RESULT_DATABASE_URL
PUBLIC_RESULT_DATABASE_PROVIDER
PUBLIC_RESULT_DATABASE_SCHEMA_VERSION
```

The schema version must match:

```text
public-result-database-record-v1
```

If `PUBLIC_RESULT_STORAGE_MODE=database` is requested with missing or mismatched values, the selection fails closed.

If all database values are present, the selection status becomes `database-configured-contract-only`, but route binding remains blocked until a later database-client integration phase.

## Client-exposed env block

The guard rejects client-exposed database environment variables, including:

```text
NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL
NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_PROVIDER
NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SCHEMA_VERSION
```

This is a server-only persistence boundary. Database credentials must never become browser-visible.

## Route behavior

Route handlers must not silently switch to a real database. In Phase 8.1:

- default route adapter: in-memory
- explicit memory mode: in-memory
- invalid storage mode: fails closed
- database mode without full env: fails closed
- database mode with full env: contract-only and route binding blocked

## Validation

The release gate is:

```text
npm run guard:database-runtime-selection
```

The full validation chain now includes this guard after:

```text
npm run contract:database-adapter
```

## Acceptance criteria

- Database adapter contract remains green.
- `PUBLIC_RESULT_STORAGE_MODE` supports only `memory` and `database`.
- Unset mode defaults to memory.
- Invalid mode fails closed.
- Database mode cannot activate accidentally.
- Missing database env vars fail closed.
- Complete database env remains contract-only before client binding.
- Route handlers remain dry-run in-memory by default.
- Client-exposed database env vars are blocked.
- No database client, migrations, auth, payment, AI, analytics, or persistent public lookup route is introduced.

## Contract phrases

- database mode is contract-only until a later database-client phase.
- client-exposed database environment variables are blocked before route binding.
