# Phase 8.6 — Database SDK Install + Client Smoke Boundary

## Status

Approved SDK-install milestone. This phase installs and locks `@neondatabase/serverless`, then proves the SDK is importable through a server-only smoke boundary without enabling persistent route behavior.

## Purpose

Phase 8.6 introduces the selected Neon SDK safely after the Phase 8.4 decision record and Phase 8.5 query contract are locked.

The goal is to verify package installation, import resolution, environment gating, and non-network client construction while keeping route handlers and adapter factory behavior unchanged.

## Contract assertions

- SDK import exists only in server-only client smoke boundary.
- Client smoke supports non-network validation first.
- Missing database env fails closed before client creation.
- Invalid database env fails closed before client creation.
- Client-exposed database env values fail closed before client creation.
- Complete database env may create a Neon query function for smoke validation only.
- No SQL mutation is executed.
- No network query is executed.
- No database-backed adapter exists yet.
- Factory still refuses route-bound database adapter.
- Routes still use memory/dry-run behavior.

## Installed package

```text
@neondatabase/serverless
```

The package is allowed only because Phase 8.4 selected it and Phase 8.5 locked the query contract first.

## Smoke boundary

```text
src/core/public-link/publicResultDatabaseClientSmokeBoundary.ts
```

The smoke boundary may import `neon` and construct a query function only when all of these conditions hold:

```text
PUBLIC_RESULT_STORAGE_MODE=database
PUBLIC_RESULT_DATABASE_URL is valid
PUBLIC_RESULT_DATABASE_PROVIDER=postgresql
PUBLIC_RESULT_DATABASE_SCHEMA_VERSION=public-result-database-record-v1
no NEXT_PUBLIC_* database env value is configured
```

The smoke boundary must not call the returned query function.

## Explicitly blocked

- Executing SQL.
- Running migrations.
- Creating a database-backed adapter.
- Binding database mode to route handlers.
- Creating persistent `/r/[publicId]` lookup behavior.
- Adding auth/payment/AI/analytics/telemetry.
- Exposing raw database URL or service key in evidence.

## Validation

```text
npm run smoke:database-client
```

The full validation chain must also remain green:

```text
npm run validate
```
