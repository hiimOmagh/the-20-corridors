# Phase 8.14 — Public API Route Database Binding Implementation Gate

## Status

Phase 8.14 wires the public API route storage resolver behind the database-binding activation decision. It is the first API-route database binding implementation gate, but it keeps rollback and public page lookup activation separate.

## Scope

This phase adds:

- explicit API route database-binding implementation flag:

```text
PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION=enabled
```

- immediate rollback flag:

```text
PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK=memory
```

- route handler storage resolver support for the database adapter when all activation controls are present;
- fake-executor route flow coverage through the actual route helper functions;
- fail-closed behavior for partial or invalid database activation;
- evidence that `/r/[publicId]` page lookup remains separate and blocked.

## Non-goals

This phase does not add:

- public `/r/[publicId]` database lookup;
- production mutation smoke;
- network SQL smoke in validation;
- auth, payment, AI, analytics, or telemetry.

## Required controls

API route database binding requires:

1. Phase 8.13 activation contract readiness.
2. `PUBLIC_RESULT_STORAGE_MODE=database`.
3. `PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION=enabled`.
4. `PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION=enabled`.
5. complete server-only database env.
6. public lookup database activation flag not enabled.

Rollback is immediate by setting:

```text
PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK=memory
```

## Validation

```bash
npm run gate:api-route-database-binding
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

## Result

The API route storage resolver can now select the database adapter under explicit activation controls. Memory remains the default and rollback target. Public `/r/[publicId]` lookup remains a separate blocked phase.
