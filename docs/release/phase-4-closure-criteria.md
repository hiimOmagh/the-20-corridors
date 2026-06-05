# Phase 4 Closure Criteria

Phase 4 can close when all local export boundaries and local PNG export contracts are verified.

## Required gates

- `npm run readiness:export` passes.
- `npm run qa:export-visual` passes.
- `npm run validate` includes both export gates.
- `npm run build` passes.
- `npm audit` and `npm audit --omit=dev` report zero vulnerabilities.

## Required product boundaries

- Local share-card PNG export works from the visible share-card summary model.
- Export does not include raw answers or question-by-question selections.
- Export does not serialize or expose the full result JSON.
- Export does not upload, persist, track, or create public links.
- Export does not use backend, database, AI, auth, payment, analytics, or telemetry scope.

## Required QA evidence

- `docs/evidence/local-export-readiness-latest.json`
- `docs/evidence/export-visual-qa-latest.json`

## Next phase dependency

Phase 5 may introduce backend/share-link work only after a separate privacy and public-link contract is created. It must not reuse the local export mechanism as implicit persistence.
