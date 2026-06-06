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
