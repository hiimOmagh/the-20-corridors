# Phase 4.0 — Local Result Export Readiness Contract

## Purpose

Phase 4.0 prepares The 20 Corridors for a future local result-export feature without implementing export behavior yet.

This phase defines what may be exported, what must never leak, and which local-only boundaries must stay intact before any image/PDF/download capability is introduced.

## Allowed future export surface

The only approved future export source is the local share-card preview model:

```text
src/features/results/resultShareCard.ts
```

A future image export may render the visible share-card preview. It must not export the full public result payload or serialized result envelope.

## Explicitly allowed in Phase 4.0

- Export-readiness documentation.
- Export-readiness automated gate.
- Privacy and leakage checks.
- Local-only share-card surface definition.
- Evidence snapshot for readiness status.

## Explicitly blocked in Phase 4.0

- No image export.
- No PNG/JPEG generation.
- No PDF generation.
- No public result links.
- No backend persistence.
- No analytics or telemetry.
- No AI/LLM report generation.
- No auth or payment flow.
- No database or object storage.

## Raw-answer leakage rule

The exportable share-card surface must not include raw question-level answer data such as:

- selected answer list
- question IDs
- answer text
- full evidence digest text
- serialized result envelope
- internal tag scores
- axis-score internals

The share-card may include only compressed public summary material:

- archetype title
- signature
- pattern summary
- top traits
- main tension
- deep motive
- confidence band
- local-only non-clinical note

## Future implementation rule

A future image-export implementation must consume the existing share-card preview surface and must be verified by a dedicated export implementation gate before shipping.

