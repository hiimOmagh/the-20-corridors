# Phase 8.20 — Public Result Lookup Operational Smoke Boundary

Phase 8.20 defines an explicit opt-in operational smoke boundary for the public `/r/[publicId]` lookup path.

This phase does not enable production network lookup smoke by default. It validates public lookup behavior through a non-production fake-executor boundary and refuses unsafe smoke contexts.

## Scope

- Add `npm run smoke:public-lookup-operational`.
- Require explicit opt-in with `PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE=enabled`.
- Require non-production smoke context through `PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT`.
- Require fake-executor safety mode through `PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE=fake-executor-only`.
- Prove rollback blocks lookup smoke.
- Prove missing/invalid env fails closed.
- Verify active, missing, deleted, and expired lookup states.
- Verify DTO-only rendering and raw-answer/delete-token exclusion.
- Keep production network lookup smoke disabled by default.

## Evidence

Latest evidence:

```text
docs/evidence/public-result-lookup-operational-smoke-boundary-latest.json
```

Expected passing status:

```text
public-result-lookup-operational-smoke-passed
```

## Non-goals

- No production network lookup smoke by default.
- No production mutation smoke.
- No auth/payment/AI/analytics/telemetry.
- No raw-answer exposure.
- No raw delete-token exposure.
