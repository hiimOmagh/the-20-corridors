# Phase 8.15 — Database Route Rollback + Failure-Mode Evidence Pack

## Purpose

Phase 8.15 verifies operational rollback and failure-mode handling after the API route database-binding implementation gate.

This phase does not activate public result-page lookup. It only proves that API route database binding can fail safely under controlled failure scenarios.

## Scope

Included:

- rollback-to-memory evidence
- missing-env fail-closed evidence
- invalid-env fail-closed evidence
- partial-activation fail-closed evidence
- database-unavailable evidence
- write-failure evidence
- read-miss evidence
- delete-token-mismatch evidence
- delete-failure evidence
- route-level storage-unavailable normalization

Excluded:

- public `/r/[publicId]` database lookup
- public lookup route activation
- production mutation smoke
- network SQL execution
- auth, payment, AI, analytics, or telemetry

## Gate

```bash
npm run evidence:database-route-failures
```

The gate writes:

```text
docs/evidence/database-route-rollback-failure-evidence-pack-latest.json
```

## Expected evidence

```text
rollbackCreateStatus: 201
rollbackReadStatus: 200
rollbackDeleteStatus: 200
missingEnvCreateStatus: 500
invalidEnvCreateStatus: 500
partialActivationCreateStatus: 500
databaseUnavailableCreateStatus: 500
writeFailureCreateStatus: 500
readMissStatus: 404
deleteTokenMismatchStatus: 403
deleteFailureStatus: 500
publicLookupActivationAllowed: false
networkQueryExecuted: false
productionMutationSmokeAllowed: false
```
