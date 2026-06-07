# Phase 8 Transition Plan — Database Adapter Boundary

## Goal

Phase 8 introduces the persistence layer safely. It must begin with a database adapter contract before any production database client, migrations, or hosted persistence are added.

## First milestone

**Phase 8.0 — Database Adapter Contract**

Required scope:

- Define the production storage adapter interface against `PublicResultStorageAdapter`.
- Define database record shape for minimized `PublicResultDto` only.
- Define result ID, delete-token hash, created-at, expiry, deleted-at, and schema-version fields.
- Define migration/version expectations without adding migrations yet.
- Define server-only access boundary.
- Keep route handlers using dry-run/in-memory behavior until the database adapter contract passes.

## Blocked until later

- Real database client import.
- Supabase/Prisma/Drizzle configuration.
- Production write/read/delete routes backed by database.
- Public lookup route `/r/[publicId]`.
- Rate limiting / abuse logging implementation.
- Auth/payment/AI/analytics.

## Acceptance criteria

- Phase 7 closure remains green.
- Database adapter contract has its own evidence snapshot.
- Raw answers and private score internals remain excluded from persistence.
- Delete-token hash is stored; raw delete token is never stored.
- Expired/deleted read behavior is specified before implementation.

## Second milestone

**Phase 8.1 — Database Adapter Runtime Selection Guard**

Required scope:

- Add a controlled runtime-selection resolver for public-result storage.
- Define `PUBLIC_RESULT_STORAGE_MODE=memory` and `PUBLIC_RESULT_STORAGE_MODE=database`.
- Keep unset/default mode on in-memory dry-run behavior.
- Fail closed for invalid storage modes.
- Fail closed for database mode when required server-only environment values are missing.
- Recognize complete database configuration as contract-only, not route-bound.
- Block client-exposed database env vars.
- Keep route handlers from silently switching to a real database adapter.

Acceptance criteria:

- Phase 8.0 database adapter contract remains green.
- Route handlers remain dry-run in-memory by default.
- Database mode cannot activate accidentally.
- Missing database env vars fail closed.
- Complete database env remains blocked from route binding until a later database-client phase.
- No production database client, migrations, auth, payment, analytics, AI, or persistent `/r/[publicId]` route is introduced.

## Third milestone

**Phase 8.2 — Database Adapter Factory Contract**

Required scope:

- Add a factory boundary for public-result storage adapter creation.
- Keep unset/default storage mode on memory.
- Allow memory mode to create the in-memory adapter through the factory.
- Recognize complete database mode as contract-only.
- Prevent configured database mode from creating a real adapter.
- Prevent configured database mode from binding to route handlers.
- Keep route handlers dry-run in-memory while routing adapter creation through the factory.

Acceptance criteria:

- Phase 8.0 database adapter contract remains green.
- Phase 8.1 runtime selection guard remains green.
- Adapter factory interface exists.
- Memory adapter remains default.
- Database adapter remains contract-only.
- Factory cannot bind database mode to routes.
- Missing database env still fails closed.
- No Supabase, Prisma, Drizzle, migration, auth, payment, AI, analytics, telemetry, or persistent `/r/[publicId]` route is introduced.


## Fourth milestone

**Phase 8.3 — Database Client Configuration Contract**

Required scope:

- Centralize required DB env names before adding any real database SDK.
- Define server-only database configuration access.
- Block client-exposed database env names.
- Validate database URL/provider/schema/service-key shape as contract-only.
- Keep database client creation disabled.
- Keep factory database adapter creation disabled.
- Keep route handlers on memory/dry-run behavior.

Acceptance criteria:

- Phase 8.0 database adapter contract remains green.
- Phase 8.1 runtime selection guard remains green.
- Phase 8.2 adapter factory contract remains green.
- Required DB env names are centralized.
- Server-only env access is enforced.
- Client-exposed DB env names are blocked.
- Database URL/service key validation is contract-only.
- No production database client, SDK import, migrations, auth, payment, AI, analytics, telemetry, or persistent `/r/[publicId]` route is introduced.

## Phase 8.4 — Database SDK Selection Decision Record

Goal: lock the future database SDK decision before importing or installing any database package.

Scope:

- select PostgreSQL as the provider target
- select `@neondatabase/serverless` as the future SDK
- document rejected alternatives
- document serverless runtime assumptions
- document the secret-handling model
- document the failure model
- prove the SDK is not installed
- prove the SDK is not imported
- prove factory database adapter creation remains blocked
- prove routes still use memory/dry-run behavior

Acceptance gate:

```text
Provider decision record exists.
SDK choice is documented but not installed/imported.
Rejected alternatives are documented.
Serverless/runtime constraints are documented.
Secret-handling model is documented.
Failure modes are defined before client binding.
No real DB SDK import exists.
Factory still cannot create a database adapter.
Routes still use memory/dry-run behavior.
Phase 8.0–8.3 gates remain green.
Full validate remains green.
```

Next intended phase: Phase 8.5 — Database Query Contract, still without route binding unless the SDK/client gate explicitly allows it.

## Phase 8.5 — Database Query Contract

Goal: lock the database table and query contract before installing or importing any database SDK.

Scope:

- define `public_result_links` table contract
- define column names and types
- define insert/read/delete/update-expiry query intents
- define soft-delete behavior
- define expired-record behavior
- define delete-token-hash lookup behavior
- prove no SQL execution exists
- prove no SDK installation/import exists
- prove factory database adapter creation remains blocked
- prove routes still use memory/dry-run behavior

Acceptance gate:

```text
Table contract is defined.
Column names and types are defined.
Insert/read/delete/update-expiry query intents are defined.
Soft-delete behavior is defined.
Expired-record behavior is defined.
Delete-token-hash lookup behavior is defined.
No SQL execution yet.
No SDK installation/import yet.
Factory still cannot create database adapter.
Routes still use memory/dry-run behavior.
Phase 8.0–8.4 gates remain green.
Full validate remains green.
```

Next intended phase: Phase 8.6 — Database SDK Install + Client Smoke Boundary. The SDK may be introduced only behind a smoke boundary and must still not bind routes to production persistence until the adapter implementation gate is explicit.


## Phase 8.6 — Database SDK Install + Client Smoke Boundary

Goal: install and lock the selected database SDK while keeping database persistence disabled.

Scope:

- install `@neondatabase/serverless`
- add a server-only client smoke boundary
- prove SDK import is confined to that boundary
- prove missing/invalid/public database env fails closed before client creation
- prove complete database env can create a non-network smoke-only query function
- prove no SQL mutation is executed
- prove no database-backed adapter exists yet
- prove factory still refuses route-bound database adapter
- prove routes still use memory/dry-run behavior

Acceptance gate:

```text
@neondatabase/serverless is installed and locked.
SDK import exists only in server-only client smoke boundary.
Client smoke supports non-network validation first.
Missing env fails closed.
Invalid env fails closed.
Client-exposed env fails closed.
No SQL mutation is executed.
No database-backed adapter exists yet.
Factory still refuses route-bound database adapter.
Routes still use memory/dry-run behavior.
Phase 8.0–8.5 gates remain green.
Full validate remains green.
```

Next intended phase: Phase 8.7 — Database Client Query Readiness Guard, still without route persistence unless explicitly approved.

## Phase 8.7 — Database Client Query Readiness Guard

Goal: prepare executable-query structure without enabling database persistence.

Scope:

- define parameterized query descriptor helpers
- map query helpers to Phase 8.5 query intents
- keep user-controlled values in values arrays only
- verify placeholder/value alignment
- prove query helpers are server-only
- prove no SQL execution or network query is performed
- prove no mutation smoke against production DB is performed
- prove SDK import remains confined to the Phase 8.6 smoke boundary
- prove no database-backed adapter exists yet
- prove factory still refuses route-bound database adapter
- prove routes still use memory/dry-run behavior

Acceptance gate:

```text
Parameterized query helpers are defined.
No raw string interpolation for user-controlled values.
Insert/read/delete/expiry query helpers map to Phase 8.5 intents.
Query helpers are server-only.
No route binding yet.
No adapter persistence yet.
No mutation smoke against production DB.
Missing/invalid env still fails closed.
Client smoke boundary remains green.
Phase 8.0–8.6 gates remain green.
Full validate remains green.
```

Next intended phase: Phase 8.8 — Database Adapter Implementation Behind Disabled Factory Gate. It should add the adapter implementation without route binding until a separate activation gate is explicit.

## Phase 8.8 — Database Adapter Implementation Behind Disabled Factory Gate

Phase 8.8 implements the database adapter behind a disabled factory gate. Database adapter implementation exists, adapter methods map create/read/delete/prune to the Phase 8.5 query intents, and all SQL execution remains behind explicit adapter methods. Factory database adapter binding remains blocked by default. Routes still use memory/dry-run behavior. No production mutation smoke yet.

Next: Phase 8.9 should add a controlled database adapter activation dry-run gate without public route persistence.

## Phase 8.9 — Database Adapter Activation Dry-Run Gate

Phase 8.9 adds a controlled database adapter activation dry-run. The dry-run selects and exercises the database adapter implementation through a fake executor, while preserving the disabled factory gate.

Acceptance gate:

```text
Activation dry-run gate exists.
Database adapter can be selected in a controlled simulation.
Factory route binding remains disabled.
Route handlers still use memory/dry-run behavior.
No real production mutation smoke.
No network SQL execution.
No persistent /r/[publicId] lookup.
Missing/invalid env still fails closed.
Adapter implementation gate remains green.
Query readiness guard remains green.
Client smoke boundary remains green.
Full validate remains green.
```

Next intended phase: Phase 8.10 — Database Adapter Factory Activation Contract. This should permit controlled factory-level database adapter construction only in non-route contexts, while route handlers remain protected until an explicit public API activation gate.

## Phase 8.10 — Database Adapter Factory Activation Contract

Phase 8.10 permits controlled factory-level database adapter construction only for explicit non-route activation contexts.

Acceptance gate:

```text
Factory can create database adapter only in explicit non-route activation context.
Factory still refuses database adapter for route handlers.
PUBLIC_RESULT_STORAGE_MODE=database alone is not enough to bind routes.
Missing/invalid env fails closed.
Database adapter activation dry-run remains green.
Adapter implementation gate remains green.
Query readiness guard remains green.
Client smoke boundary remains green.
No production mutation smoke yet.
No persistent /r/[publicId] lookup yet.
Full validate remains green.
```

Next intended phase: Phase 8.11 — Public Route Database Binding Preflight Contract. It should define the route activation criteria without yet switching public routes to database persistence.

## Phase 8.11 — Public Route Database Binding Preflight Contract

Phase 8.11 defines the exact route-level database activation criteria before any public API route can bind to database persistence.

Acceptance gate:

```text
Route binding preflight contract exists.
PUBLIC_RESULT_STORAGE_MODE=database alone is still insufficient.
Explicit route-binding flag is required but still does not activate routes.
Complete DB env is required.
Factory activation contract remains green.
Route handlers still use memory/dry-run behavior.
No production mutation smoke yet.
No persistent /r/[publicId] lookup yet.
Full validate remains green.
```

Next intended phase: Phase 8.12 — Public Route Database Binding Dry-Run Contract. It should simulate public route database binding with fake executor evidence before any production persistence activation.

## Phase 8.12 — Public Route Database Binding Dry-Run Contract

Phase 8.12 simulates public route database binding with a fake executor before any production route persistence activation.

Acceptance gate:

```text
Route database binding dry-run contract exists.
Preflight contract remains green.
Fake route-bound database adapter can execute create/read/delete/prune simulation.
Actual public route handlers still use memory/dry-run behavior.
No production mutation smoke.
No network SQL execution.
No persistent /r/[publicId] lookup yet.
Full validate remains green.
```

Next intended phase: Phase 8.13 — Public Route Database Binding Activation Contract. It should decide whether route binding can be enabled under explicit production-safe controls, and must still separate route persistence activation from public `/r/[publicId]` page activation.

## Phase 8.13 — Public Route Database Binding Activation Contract

Phase 8.13 defines the production-safe API route database-binding activation decision without applying route persistence.

Acceptance gate:

```text
Activation contract exists.
Phase 8.11 preflight remains green.
Phase 8.12 fake-executor dry-run remains green.
Explicit route database-binding activation flag is required.
API route database-binding activation can be ready but not applied.
Actual public route handlers remain memory/dry-run.
Public /r/[publicId] page lookup remains a separate blocked activation.
No production mutation smoke runs.
No network SQL execution runs.
No persistent public lookup route exists.
Full validate remains green.
```

Next intended phase: Phase 8.14 — Public API Route Database Binding Implementation Gate. It should wire route handlers behind the activation decision while preserving a rollback path and still keeping `/r/[publicId]` page activation separate.

## Phase 8.15 — Database Route Rollback + Failure-Mode Evidence Pack

Phase 8.15 hardens the operational safety surface after API route database-binding implementation. It verifies rollback-to-memory behavior and normalizes database route failure modes before any public lookup activation.

Acceptance gate:

```text
Explicit rollback-to-memory evidence exists.
Missing env fails closed.
Invalid env fails closed.
Partial activation fails closed.
Database unavailable is modeled.
Write failure is modeled.
Read miss is modeled.
Delete-token mismatch is modeled.
Delete failure is modeled.
API route binding gate remains green.
No /r/[publicId] page database lookup yet.
No public lookup activation yet.
Full validate remains green.
Build remains green.
```

Next intended phase: Phase 8.16 — Public Result Lookup Page Preflight Contract. It should define public `/r/[publicId]` page lookup activation criteria without enabling database lookup in the page yet.

## Phase 8.16 — Public Result Lookup Page Preflight Contract

Phase 8.16 defines the public `/r/[publicId]` database lookup preflight criteria without enabling public result-page lookup.

Acceptance gate:

```text
Public lookup page preflight contract exists.
API route database binding gate remains green.
Rollback/failure evidence remains green.
PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION flag is defined.
PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT flag is defined.
Complete DB env is required.
API route database binding does not automatically activate /r/[publicId].
Public lookup remains disabled by default.
No public page database read yet.
No production network lookup smoke yet.
Full validate remains green.
Build remains green.
```

Next intended phase: Phase 8.17 — Public Result Lookup Page Dry-Run Contract. It should simulate `/r/[publicId]` database lookup through a fake executor while keeping the actual public page lookup disabled.

## Phase 8.17 — Public Result Lookup Page Dry-Run Contract

Phase 8.17 simulates `/r/[publicId]` database lookup through a fake executor while keeping actual public result-page lookup disabled.

Acceptance gate:

```text
Public lookup page dry-run contract exists.
Phase 8.16 preflight remains green.
Fake lookup adapter can resolve active public DTO by publicId.
Read miss returns not-found behavior.
Deleted result returns unavailable behavior without DTO exposure.
Expired result returns expired/unavailable behavior without DTO exposure.
No real /r/[publicId] database read yet.
No production network lookup smoke yet.
No route-page activation yet.
API route binding gate remains green.
Rollback/failure evidence remains green.
Full validate remains green.
Build remains green.
```

Next intended phase: Phase 8.18 — Public Result Lookup Page Activation Contract. It should define the production-safe activation decision for `/r/[publicId]` page lookup without coupling it to API route persistence rollback.

## Phase 8.18 — Public Result Lookup Page Activation Contract

Phase 8.18 defines the production-safe activation decision for `/r/[publicId]` page lookup without implementing the real database-backed page route.

Acceptance gate:

```text
Public lookup page activation contract exists.
Phase 8.17 dry-run remains green.
API route database binding gate remains green.
Rollback/failure evidence remains green.
Activation requires explicit PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION=enabled.
Activation requires complete DB env.
Activation requires API route database binding already valid.
Activation does not bypass rollback mode.
No real /r/[publicId] database read yet.
No production network lookup smoke yet.
No public page route implementation yet.
Full validate remains green.
Build remains green.
```

Next intended phase: Phase 8.19 — Public Result Lookup Page Implementation Gate. It should implement the page lookup behind the Phase 8.18 activation decision while preserving rollback and failure-mode controls.

## Phase 8.19 — Public Result Lookup Page Implementation Gate

Phase 8.19 implements the public `/r/[publicId]` lookup page behind the Phase 8.18 activation decision while preserving rollback and failure-mode behavior.

Acceptance gate:

```text
/r/[publicId] route implementation exists.
Default behavior remains disabled or safe fallback.
Activation requires Phase 8.18 decision.
Rollback mode blocks page database lookup.
Missing/invalid env fails closed.
Read miss renders not-found behavior.
Deleted/expired result renders unavailable/expired behavior.
Renderable result exposes DTO-only public fields.
No raw answers exposed.
No raw delete token exposed.
No production network lookup smoke by default.
API route binding gate remains green.
Rollback/failure evidence remains green.
Full validate remains green.
Build remains green.
```

Next intended phase: Phase 8.20 — Public Result Lookup Operational Smoke Boundary. It should define an explicit, opt-in non-production smoke boundary for public lookup behavior without running production network lookup by default.

## Phase 8.20 — Public Result Lookup Operational Smoke Boundary

Phase 8.20 defines an explicit opt-in non-production smoke boundary for `/r/[publicId]` lookup behavior without enabling production network lookup smoke by default.

Acceptance gate:

```text
Operational smoke boundary exists.
Smoke is opt-in only.
Smoke refuses production unless explicit non-production/safe flag is set.
Page implementation gate remains green.
Rollback blocks lookup smoke.
Missing/invalid env fails closed.
Network lookup smoke remains disabled by default.
DTO-only rendering is verified.
Deleted/expired/missing states are verified.
No raw answers exposed.
No raw delete token exposed.
Full validate remains green.
Build remains green.
```

Next intended phase: Phase 8.21 — Public Lookup Operational Rollback Drill. It should prove rollback behavior across API route persistence and public lookup rendering as one operational drill without running production network lookup smoke by default.

## Phase 8.21 — Public Lookup Operational Rollback Drill

Phase 8.21 proves rollback behavior across API route persistence and public lookup rendering as one operational drill without running production network lookup smoke by default.

Acceptance gate:

```text
Operational rollback drill exists.
API route database binding can be active in simulated safe mode.
Public lookup can be active in simulated safe mode.
Rollback flag forces API route storage back to memory.
Rollback flag disables public lookup rendering.
Rollback does not expose stale database DTOs.
Deleted/expired/missing states remain DTO-free after rollback.
No raw answers exposed.
No raw delete token exposed.
No production network lookup smoke by default.
Operational smoke boundary remains green.
Full validate remains green.
Build remains green.
```

Next intended phase: Phase 8.22 — Public Lookup Release Closure Gate. It should close Phase 8 with consolidated evidence for database adapter, API persistence, public lookup, rollback, and operational smoke controls before moving to the next feature track.
