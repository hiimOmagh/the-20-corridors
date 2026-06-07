# Phase 8.13 — Public Route Database Binding Activation Contract

## Status

Phase 8.13 defines the API route database-binding activation decision. It is not a route persistence implementation phase.

## Scope

This phase adds:

- `PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION=enabled` as the explicit activation-decision flag.
- API route database-binding activation readiness after the Phase 8.11 preflight and Phase 8.12 fake-executor dry-run are green.
- Separation between public API route persistence activation and public `/r/[publicId]` page lookup activation.
- A release gate proving actual route handlers still use memory/dry-run behavior.

## Non-goals

This phase does not add:

- production database route binding;
- production mutation smoke;
- network SQL execution;
- persistent `/r/[publicId]` lookup;
- auth, payment, AI, analytics, or telemetry.

## Required controls

The activation decision requires:

1. Phase 8.11 preflight evidence.
2. Phase 8.12 route database-binding dry-run evidence.
3. `PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION=enabled`.
4. API-route-only acknowledgement.
5. acknowledgement that actual route handlers remain unchanged.
6. public `/r/[publicId]` lookup activation flag not enabled.

## Validation

```bash
npm run contract:route-database-binding-activation
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

## Result

The activation contract may report `api-route-database-binding-activation-ready-not-applied`, but the actual public route handler resolver remains memory/dry-run. Public `/r/[publicId]` lookup remains a separate blocked activation.

Contract phrases:

- API route database binding activation decision.
- Public /r/[publicId] page lookup remains separate.
