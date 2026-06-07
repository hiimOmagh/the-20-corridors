# Phase 8.21 — Public Lookup Operational Rollback Drill

Phase 8.21 adds an operational rollback drill for the public-result persistence rollout.

The drill proves that API route database persistence and public `/r/[publicId]` lookup rendering can both be active in a safe fake-executor context, then verifies that the single rollback flag forces API route storage back to memory and disables public lookup rendering without leaking stale DTOs.

## Scope

Included:

- API route database binding before rollback.
- Public lookup rendering before rollback.
- Operational smoke evidence dependency.
- Rollback-to-memory drill.
- Public lookup disabled after rollback.
- Stale database DTO exposure guard.
- Missing/deleted/expired DTO-free state checks.
- Raw-answer and raw-delete-token exposure guards.
- Production network lookup smoke remains disabled.

Excluded:

- Production network lookup smoke.
- Production mutation smoke.
- Auth, payment, AI, analytics, or telemetry.

## Command

```bash
npm run drill:public-lookup-rollback
```

## Evidence

```text
docs/evidence/public-lookup-operational-rollback-drill-latest.json
```
