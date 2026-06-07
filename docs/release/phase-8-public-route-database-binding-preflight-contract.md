# Phase 8.11 — Public Route Database Binding Preflight Contract

## Status

Phase 8.11 defines the public route database-binding preflight contract. It does not activate database persistence for public API routes.

## Contract

Route binding preflight contract exists.

PUBLIC_RESULT_STORAGE_MODE=database alone is still insufficient for public route database binding.

Explicit route-binding flag is required but still does not activate routes. The preflight flag is `PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT=enabled`.

Complete DB env is required before the preflight can be ready. Factory activation contract remains green and still blocks route-handler context from constructing a database adapter.

## Runtime boundary

Route handlers still use memory/dry-run behavior. The public API route adapter factory remains protected, and route binding remains disabled even when the preflight criteria are satisfied.

The Phase 8.11 decision can report `route-database-binding-preflight-ready-but-disabled`; this means the activation criteria are complete enough for a future route activation phase, not that routes have changed behavior.

## Explicit non-goals

- No public route database binding.
- No production mutation smoke yet.
- No network SQL execution.
- No persistent /r/[publicId] lookup yet.
- No auth/payment/AI/analytics/telemetry integration.
- No route persistence activation.

## Validation

The phase gate is `npm run contract:route-database-binding-preflight`. The full validation chain must include this gate after Phase 8.10.
