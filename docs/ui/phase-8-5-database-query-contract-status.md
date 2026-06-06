# Phase 8.5 — Database Query Contract Status

## User-visible status

The project has a database query contract, but still does not use a production database.

## What changed

- Table contract is defined.
- Column names and types are defined.
- Insert/read/delete/update-expiry query intents are defined.
- Soft-delete behavior is defined.
- Expired-record behavior is defined.
- Delete-token-hash lookup behavior is defined.
- No SQL execution yet.
- No SDK installation/import yet.
- Factory still cannot create database adapter.
- Routes still use memory/dry-run behavior.

## What remains blocked

- Database SDK installation.
- Database SDK import.
- Database client creation.
- SQL execution.
- Migration files.
- Database-backed route persistence.
- Persistent `/r/[publicId]` public lookup.
- Auth/payment/AI/analytics/telemetry.
