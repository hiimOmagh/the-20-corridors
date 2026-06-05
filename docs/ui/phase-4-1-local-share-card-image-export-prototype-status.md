# Phase 4.1 — Local Share Card Image Export Prototype

## Status

Implemented as a local-only browser export prototype.

## Scope

Phase 4.1 adds a local PNG export action for the visible share-card summary surface. The implementation generates an SVG from the already-compressed share-card view model, draws it to a browser canvas, and triggers a local PNG download in the current browser session.

## Included

- Local PNG export button on the result share-card section.
- SVG-based share-card image renderer.
- Browser-local canvas PNG conversion.
- Export status copy for idle/exporting/exported/unsupported/failed states.
- Filename helper for deterministic PNG names.
- Export-readiness gate updated for Phase 4.1 implementation.
- Tests for SVG safety, filename generation, status copy, and export-boundary gates.

## Preserved boundaries

- No backend.
- No database.
- No public result links.
- No AI/LLM generation.
- No auth.
- No payment flow.
- No analytics or telemetry.
- No full public-result serialization export.
- No raw answer-level export surface.
- No third-party screenshot/export dependency.

## Allowed export surface

The only approved image export source is:

```text
src/features/results/resultShareImageExport.ts
```

It must consume the local share-card preview model from:

```text
src/features/results/resultShareCard.ts
```

The result page may call the export function, but it must not export raw answers, serialized full result data, evidence digest text, or backend/public URLs.
