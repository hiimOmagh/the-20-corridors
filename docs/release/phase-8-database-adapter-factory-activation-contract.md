# Phase 8.10 — Database Adapter Factory Activation Contract

## Status

Phase 8.10 introduces a controlled factory activation contract for the database adapter. It does not activate database persistence for public routes.

## Contract

Factory can create database adapter only in explicit non-route activation context.

Factory still refuses database adapter for route handlers. PUBLIC_RESULT_STORAGE_MODE=database alone is not enough to bind routes, construct a route adapter, or change public API behavior.

The only approved activation context in this phase is `explicit-non-route-database-activation`, with all of the following present:

- complete database client configuration
- explicit no-route-binding acknowledgement
- injected query executor
- non-route activation context

## Runtime boundary

Public-result route handlers remain memory/dry-run. The base route factory still does not create a database adapter for route-handler use.

The Phase 8.10 factory activation path is a controlled non-route construction path only. It exists to prove that adapter construction can be made explicit before a later route activation gate.

## Explicit non-goals

- No public route database binding.
- No production mutation smoke yet.
- No network SQL execution.
- No persistent /r/[publicId] lookup yet.
- No auth/payment/AI/analytics/telemetry integration.
- No migration execution.

## Validation

The phase gate is `npm run contract:database-factory-activation`. The full validation chain must include this gate after Phase 8.9.
