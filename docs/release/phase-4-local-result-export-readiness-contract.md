# Phase 4 — Local Result Export Contract

## Purpose

Phase 4 defines the local result-export boundary for The 20 Corridors.

The allowed goal is narrow: export a local PNG image from the compressed share-card summary surface. The export must remain browser-local and must not create public links, upload data, serialize the full result, or expose answer-level data.

## Approved export surface

The only approved export source is the local share-card model and image-export helper:

```text
src/features/results/resultShareCard.ts
src/features/results/resultShareImageExport.ts
```

The result client may call the export helper:

```text
src/features/results/ResultsClient.tsx
```

## Explicitly allowed in Phase 4.1

- Local PNG export from the share-card surface.
- SVG generated from the compressed share-card preview.
- Browser-local canvas conversion.
- Local download trigger.
- Export status copy in component state.
- Export-readiness gate verification.
- Tests for image-export helper safety.

## Explicitly blocked

- No backend persistence.
- No database or object storage.
- No public result links.
- No analytics or telemetry.
- No AI/LLM report generation.
- No auth or payment flow.
- No PDF export.
- No full result JSON export.
- No serialized public-result envelope export.
- No raw answer-level export.
- No third-party screenshot library such as html2canvas.

## Answer-level leakage rule

The exportable share-card image must not include answer-level material such as:

- selected answer list
- question IDs
- answer text
- full evidence digest text
- serialized result envelope
- internal tag scores
- axis-score internals

The image may include only compressed public summary material:

- archetype title
- signature
- pattern summary
- top traits
- main tension
- deep motive
- confidence band
- local-only non-clinical note

## Implementation rule

The implementation must consume `LocalShareCardPreview`, not `CorridorsPublicResultDto` directly. This keeps the export layer downstream of the already-compressed share-card view model.

## Validation rule

`npm run readiness:export` must pass before export changes are committed.

## Phase 4.2 hardening addendum

The local share-card image export may show filename, dimensions, browser capability, status, and fallback guidance before or after export.

The export surface remains limited to the compressed share-card summary. It must not include raw answers, answer-by-answer records, full serialized result data, public URLs, backend upload, analytics event, auth state, database write, or payment flow.

Allowed hardening additions:

- visible filename and dimensions;
- visible browser capability summary;
- local unsupported/failure copy;
- retry/copy-text fallback guidance;
- local-only privacy boundary bullets.

Blocked additions remain unchanged: backend export, public result links, full-result export, raw-answer export, PDF export, AI generation, telemetry, database, authentication, and payments.
