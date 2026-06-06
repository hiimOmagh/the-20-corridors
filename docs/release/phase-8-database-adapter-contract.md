# Phase 8.0 — Database Adapter Contract

## Purpose

Phase 8.0 defines the database adapter boundary before any production persistence implementation is introduced.

The contract prepares the production persistence seam against `PublicResultStorageAdapter`, but it does not bind a real database client, does not add migrations, and does not switch the route handlers away from the current dry-run in-memory behavior.

## Scope

Included:

- `DatabasePublicResultStorageAdapterContract` extending `PublicResultStorageAdapter`
- database record shape for minimized PublicResultDto only
- result id field through `publicId`
- delete-token hash is stored through `deleteTokenHash`
- raw delete token is never stored
- `createdAt`, `expiresAt`, `deletedAt`, and schema version fields
- migration expectations without migration files
- server-only access boundary
- expired/deleted read behavior before implementation
- evidence snapshot at `docs/evidence/database-adapter-contract-latest.json`

Excluded:

- production database client import
- production adapter implementation
- migration files
- hosted persistence
- public lookup route under `/r/[publicId]`
- auth
- payment
- AI
- analytics
- abuse-control implementation

## Record contract

Database records are allowed to contain only:

```text
schemaVersion
publicId
dto
deleteTokenHash
createdAt
expiresAt
deletedAt
status
```

The `dto` must remain minimized PublicResultDto only. Raw answers, private score internals, full serialized result payloads, identifying user data, and raw delete tokens are excluded.

## Delete-token rule

The database stores only the delete-token hash. The raw delete token is allowed only in create response transport and delete request transport, as already defined by the backend API boundary. It is not part of the database record.

## Migration expectations

Phase 8.0 defines migration expectations but introduces no migration files.

Future migration work must:

- keep a schema version on every record
- bump schema version for structural changes
- define forward and rollback expectations before binding a client
- reject unsupported record schema versions
- keep the stored payload minimized to the public DTO

## Server-only access boundary

The adapter is a server-only access boundary. Future implementation may be used by route handlers, but it must not be imported by client components, UI features, browser storage helpers, or public preview UI code.

## Expired/deleted read behavior

The contract specifies expired/deleted read behavior before implementation:

- missing record returns `not-found` with no record
- active record maps to an active public storage record
- expired record maps to `expired`; upstream public API response must null the DTO
- deleted record maps to `deleted`; upstream public API response must null the DTO
- `deletedAt` wins over stale active status
- expiry is resolved at read time

## Route boundary

route handlers remain dry-run in-memory for Phase 8.0. The contract must fail if Phase 8.0 switches production routes to a real database adapter.
