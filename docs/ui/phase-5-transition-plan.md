# Phase 5 Transition Plan — Public Link and Persistence Readiness

## Purpose

Phase 5 may evaluate public share links or persistence, but it must start with privacy and data-boundary contracts before any backend implementation.

## Required first milestone

Phase 5.0 should be a contract-only package:

```text
Phase 5.0 — Public Result Link Privacy Contract
```

It must define:

- which result fields may be public
- which fields stay local-only
- whether raw answers are ever stored
- deletion/expiry behavior
- anonymous result ID rules
- public URL structure
- backend/database boundary checks
- abuse and unwanted-indexing considerations

## Non-negotiable boundary

Do not implement backend persistence before the contract exists.

## Carryover from Phase 4

The local PNG export remains:

- local-only
- share-card-summary-only
- no raw answers
- no full result JSON
- no public URL
- no upload
- no analytics/telemetry

## Recommended Phase 5 sequence

1. Public result link privacy contract.
2. Public result DTO minimization.
3. Optional anonymous storage proof-of-concept.
4. Delete/expiry behavior.
5. Public link UI.
6. Public-link smoke/closure gates.
