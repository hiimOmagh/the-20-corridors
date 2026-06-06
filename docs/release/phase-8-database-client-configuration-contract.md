# Phase 8.3 — Database Client Configuration Contract

## Scope

Phase 8.3 defines the future database client configuration contract. It does not introduce a production database client, database SDK, migration files, hosted persistence, authentication, payment, AI, analytics, telemetry, or a persistent `/r/[publicId]` route.

The goal is to centralize the environment-variable contract before any database SDK is imported.

## Contract

Required DB env names are centralized in `src/core/public-link/publicResultDatabaseClientConfig.ts`.

Server-only env access is enforced by keeping all database configuration under non-`NEXT_PUBLIC_` names.

Client-exposed DB env names are blocked, including the public service-key variant.

Database URL/service key validation is contract-only. The URL/provider/schema/service-key shape is validated, but no client is created.

No production database client is introduced.

Factory still cannot create a database adapter.

Routes still use memory/dry-run behavior.

## Server-only env contract

Required contract keys:

```text
PUBLIC_RESULT_DATABASE_URL
PUBLIC_RESULT_DATABASE_PROVIDER
PUBLIC_RESULT_DATABASE_SCHEMA_VERSION
```

Optional server-only sensitive key:

```text
PUBLIC_RESULT_DATABASE_SERVICE_KEY
```

Forbidden public keys:

```text
NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_URL
NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_PROVIDER
NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SCHEMA_VERSION
NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY
```

## Route behavior

Allowed route-bound state remains:

```text
memory mode -> factory -> in-memory adapter -> dry-run route handlers
```

Blocked route-bound state remains:

```text
database config -> database client -> database adapter -> route handlers
```

## Validation

```text
npm run contract:database-client-config
```

The full validation chain also includes this contract after Phase 8.0, Phase 8.1, and Phase 8.2:

```text
npm run validate
```

## Disproven if

This phase is invalid if it imports a database SDK, creates a database client, creates migration files, binds database mode to route handlers, exposes database config through `NEXT_PUBLIC_` variables, or allows the factory to create a database adapter.

## Required contract phrases

required DB env names are centralized

server-only env access is enforced

client-exposed DB env names are blocked

database URL/service key validation is contract-only

no production database client

factory still cannot create a database adapter

routes still use memory/dry-run behavior

Phase 8.3
