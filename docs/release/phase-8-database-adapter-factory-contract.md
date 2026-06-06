# Phase 8.2 — Database Adapter Factory Contract

## Scope

Phase 8.2 introduces the adapter factory boundary for public-result storage. It does not introduce production persistence.

The adapter factory interface exists so later phases can add a real database adapter without changing route-handler semantics implicitly.

## Contract

- The adapter factory interface exists in `src/core/public-link/publicResultStorageAdapterFactory.ts`.
- Memory remains the default when `PUBLIC_RESULT_STORAGE_MODE` is unset.
- Explicit `PUBLIC_RESULT_STORAGE_MODE=memory` creates the in-memory adapter.
- Complete `PUBLIC_RESULT_STORAGE_MODE=database` configuration remains contract-only.
- Database mode remains contract-only and cannot create a real adapter in this phase.
- The factory cannot bind database mode to route handlers.
- Missing database env still fails closed through the Phase 8.1 runtime-selection guard.
- Invalid mode still fails closed through the Phase 8.1 runtime-selection guard.
- Client-exposed database environment variables remain blocked.

## Route behavior

Route handlers now resolve adapter creation through the factory boundary, but their runtime behavior remains dry-run in-memory.

Allowed route-bound state:

```text
memory mode -> in-memory adapter -> dry-run route handlers
```

Blocked route-bound state:

```text
database mode -> real database adapter -> route handlers
```

## Explicit non-goals

No production database client is added.

No Supabase, Prisma, Drizzle, migration, auth, payment, AI, or analytics integration is added.

No persistent public lookup route is added.

No raw answers, private score internals, full result serialization, or raw delete token transport is added.

## Validation

```text
npm run contract:database-adapter-factory
```

The full validation chain also includes this contract after Phase 8.0 and Phase 8.1:

```text
npm run validate
```

## Disproven if

This phase is invalid if configured database mode can create a real adapter, bind to route handlers, import a database SDK, create migration files, or expose database configuration through client-side environment variables.

## Required contract phrases

The adapter factory interface exists.

Memory remains the default.

Database mode remains contract-only.

The factory cannot bind database mode to route handlers.

No production database client.

No Supabase, Prisma, Drizzle, migration, auth, payment, AI, or analytics integration.

Exact guard strings:

adapter factory interface exists
memory remains the default
database mode remains contract-only
factory cannot bind database mode to route handlers
no production database client
no Supabase, Prisma, Drizzle, migration, auth, payment, AI, or analytics integration
