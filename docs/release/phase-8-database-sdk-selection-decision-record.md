# Phase 8.4 — Database SDK Selection Decision Record

## Verdict

Phase 8.4 locks the future database SDK decision without installing, importing, or binding that SDK.

- selected provider: `postgresql`
- selected SDK: @neondatabase/serverless
- selected runtime: `next-route-handlers-node-runtime`
- adapter strategy: `thin-sql-adapter-over-public-result-storage-contract`
- SDK is documented but not installed
- SDK is documented but not imported
- database client creation remains blocked
- factory still cannot create a database adapter
- routes still use memory/dry-run behavior

## Decision scope

This is a decision record only. It does not add production persistence.

Allowed in this phase:

- document the selected database provider
- document the selected SDK package name
- document rejected alternatives
- document serverless runtime assumptions
- document the secret-handling model
- document the failure model
- add a release guard proving no SDK package is installed or imported

Blocked in this phase:

- installing `@neondatabase/serverless`
- importing `@neondatabase/serverless`
- creating a database client
- creating a database adapter
- binding database mode to API routes
- adding migration files
- adding a persistent `/r/[publicId]` route
- adding auth, payment, AI, analytics, or telemetry

## Selected SDK

The selected future SDK is `@neondatabase/serverless`.

Reasoning:

1. The Phase 8 storage contract is already PostgreSQL-oriented.
2. The app is a Next.js app with route-handler API boundaries.
3. Public result persistence is narrow: create, read, soft-delete, and prune.
4. A thin SQL adapter is preferable to an ORM before the real query contract is locked.
5. The SDK can later consume the centralized server-only environment contract from Phase 8.3.

## Rejected alternatives

These rejected alternatives are documented before any real client binding:

| Alternative | Rejection reason |
|---|---|
| `@supabase/supabase-js` | Avoid platform/auth/storage coupling before minimal public-result persistence. |
| `prisma/@prisma-client` | Avoid ORM client and migration complexity before the SQL contract is locked. |
| `drizzle-orm` | Avoid schema abstraction before the storage query contract is locked. |
| `pg` | Avoid raw TCP/pooling assumptions in serverless route handlers. |
| `mongoose` | The Phase 8 record contract is PostgreSQL-oriented, not document-store-oriented. |

## Serverless runtime assumptions

The future adapter must assume:

- route handlers are server-side only
- database config is read only from server-only env variables
- database mode fails closed if config is missing or invalid
- route responses must not expose raw database errors or env values
- storage remains DTO-only and delete-token-hash-only
- the SDK cannot be loaded in client components

## Secret-handling model

The secret-handling model is:

1. `PUBLIC_RESULT_DATABASE_URL` is server-only.
2. `PUBLIC_RESULT_DATABASE_PROVIDER` is server-only.
3. `PUBLIC_RESULT_DATABASE_SCHEMA_VERSION` is server-only.
4. `PUBLIC_RESULT_DATABASE_SERVICE_KEY` is server-only.
5. `NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_*` names are forbidden.
6. Raw delete tokens are never persisted.
7. Only `deleteTokenHash` may be stored.
8. Route responses must not expose env values, SQL errors, stack traces, or private scoring internals.

## Failure model

The failure model is locked before client binding:

| Failure | Required behavior |
|---|---|
| `missing-env` | Fail closed before adapter creation. |
| `invalid-env` | Fail closed before adapter creation. |
| `database-unavailable` | Return controlled server failure without raw result or token leakage. |
| `write-failure` | Do not issue a public id as persisted success. |
| `read-miss` | Return `not-found` with null record. |
| `read-expired` | Return expired disposition without public DTO response. |
| `delete-token-mismatch` | Reject delete without mutating record. |
| `delete-failure` | Preserve record state and return controlled failure. |
| `schema-version-mismatch` | Reject record before public response mapping. |

## Acceptance criteria

```text
Provider decision record exists.
SDK choice is documented but not installed/imported.
Rejected alternatives are documented.
Serverless/runtime constraints are documented.
Secret-handling model is documented.
Failure modes are defined: missing env, invalid env, DB unavailable, write failure, read miss, delete failure.
No real DB SDK import exists.
Factory still cannot create a database adapter.
Routes still use memory/dry-run behavior.
Phase 8.0–8.3 gates remain green.
Full validate remains green.
```
