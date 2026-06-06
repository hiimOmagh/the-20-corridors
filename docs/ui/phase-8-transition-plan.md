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
