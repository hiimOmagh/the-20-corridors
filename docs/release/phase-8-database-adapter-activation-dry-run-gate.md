# Phase 8.9 — Database Adapter Activation Dry-Run Gate

## Status

Phase 8.9 introduces an activation dry-run gate for the database adapter. It does not activate database persistence for public routes.

## Contract

Activation dry-run gate exists. Database adapter can be selected in a controlled simulation through a fake executor that exercises the implemented adapter path without production database mutation.

The dry-run confirms the adapter implementation can perform create, read, delete, and prune flows through the Phase 8.7 parameterized query descriptors.

## Disabled production binding

Factory route binding remains disabled. The factory still reports database mode as contract-only for route purposes, and it does not create a database adapter for public route handlers.

Route handlers still use memory/dry-run behavior. No public API route is allowed to switch to database persistence in this phase.

## Explicit non-goals

- No real production mutation smoke.
- No network SQL execution.
- No route database persistence.
- No persistent `/r/[publicId]` lookup.
- No auth/payment/AI/analytics/telemetry integration.
- No migration execution.

## Validation

The phase gate is `npm run dryrun:database-adapter-activation`. The full validation chain must include this gate after Phase 8.8.
