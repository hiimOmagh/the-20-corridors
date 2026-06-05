# Phase 4 Transition Plan

## Recommended Phase 4 theme

Phase 4 should move from visual polish to measured local product readiness. The safest next step is not backend persistence or AI. The recommended next phase is a local export/share-readiness layer.

## Candidate milestones

### Phase 4.0 — Local Result Export Readiness Contract

Define what may be exported, what must remain private, and how export boundaries are verified before implementing image/PDF export.

### Phase 4.1 — Local Image Export Prototype

Generate a local share-card image from the existing deterministic result and local share-card preview. No server upload and no public URL.

### Phase 4.2 — Export Quality Guard

Verify image readability, local-only boundaries, reduced-motion independence, and no raw-answer leakage.

## Explicitly blocked until a later phase

- backend persistence
- account/auth flows
- database storage
- AI/LLM report generation
- payments
- analytics/telemetry
- public result pages

## Required gates before Phase 4

- `npm run validate`
- `npm audit --omit=dev`
- `npm audit`
- `npm run build`
