# Phase 8.5 — Database Query Contract

## Status

Approved contract-only milestone. No SQL is executed in this phase.

## Purpose

Phase 8.5 locks the database table and query contract before installing or importing `@neondatabase/serverless`.

The goal is to define exactly what the future database adapter may query, what it may store, and how lifecycle states behave, while keeping the current route behavior unchanged.

## Contract assertions

- Table contract is defined for `public_result_links`.
- Column names and types are defined before SDK installation.
- Insert/read/delete/update-expiry query intents are defined as non-executable contract metadata.
- Soft-delete behavior is defined using `deleted_at` and `status = deleted`.
- Expired-record behavior is defined as read-time disposition plus future expiry marking.
- Delete-token-hash lookup behavior is defined without raw delete-token persistence.
- No SQL execution yet.
- No SDK installation/import yet.
- Factory still cannot create database adapter.
- Routes still use memory/dry-run behavior.

## Table contract

```text
public_result_links
```

Required columns:

```text
schema_version text not null
public_id text primary key
dto jsonb not null
delete_token_hash text not null
created_at timestamptz not null
expires_at timestamptz not null
deleted_at timestamptz null
status text not null
updated_at timestamptz not null
```

## Query intents

The query contract defines these future intents only:

1. `insert-public-result-record`
2. `read-active-public-result-by-public-id`
3. `verify-delete-token-hash-for-public-id`
4. `soft-delete-public-result-by-public-id`
5. `mark-expired-public-results`
6. `prune-deleted-or-expired-public-results`

Each intent is marked `executionAllowed: false` in Phase 8.5.

## Explicitly blocked

- Installing `@neondatabase/serverless`.
- Importing `@neondatabase/serverless`.
- Creating a database client.
- Executing SQL.
- Adding migrations.
- Creating a database-backed adapter.
- Binding database mode to route handlers.
- Creating persistent `/r/[publicId]` lookup behavior.
- Adding auth/payment/AI/analytics/telemetry.

## Validation

```text
npm run contract:database-query
```

The full validation chain must also remain green:

```text
npm run validate
```
