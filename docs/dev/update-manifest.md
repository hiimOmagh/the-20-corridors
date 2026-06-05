# Update Manifest

## Package

`the-20-corridors_phase1_5_public_api_boundary.zip`

## Phase

Phase 1.5 — Engine Public API Boundary + Import Hygiene

## Purpose

Add a stable public engine boundary before UI work begins. Future app/UI layers should consume the deterministic engine through `src/core` only, not through internal methodology, scoring, report, or audit modules.

This package remains UI-free and backend-free. It does not add React, Next.js, CSS, database logic, AI generation, PDF export, accounts, or sharing.

## Files included

Only new or modified files are included in this update package:

```text
README.md
docs/dev/update-manifest.md
src/core/engine.ts
src/core/index.ts
src/core/publicTypes.ts
tests/core/importBoundary.test.ts
tests/core/publicApi.test.ts
```

## Files intentionally not included

```text
unchanged methodology files
unchanged scoring files
unchanged report composer files
unchanged quality guard files
unchanged audit files
unchanged golden/edge-case fixtures
node_modules/
Next.js app files
React UI components
CSS/Tailwind files
database files
AI report generation
PDF/share-card generation
```

Reason: the project rule is changed-files-only update packaging.

## What changed

```text
Added src/core/index.ts as the single public engine entrypoint.
Added src/core/engine.ts with public engine functions.
Added src/core/publicTypes.ts with stable public DTO types.
Added UI-safe getCorridorQuestions() output that excludes scoring tags.
Added runCorridorsEngine() output that excludes internal numeric diagnostics.
Added public answer parsing/normalization wrappers.
Added public API tests for deterministic output and result completeness.
Added import-boundary tests to prevent future UI/app code from importing internal core modules directly.
Updated README with public API guidance.
```

## Public API functions

```text
getCorridorQuestions()
parseCorridorAnswerSequence(sequence)
normalizeCorridorAnswers(input)
runCorridorsEngine(input)
```

## Apply instructions

From repository root:

```bash
unzip -o the-20-corridors_phase1_5_public_api_boundary.zip
npm run validate
npm audit --omit=dev
npm audit
git status --short
```

Then commit:

```bash
git add README.md docs/dev/update-manifest.md src/core/engine.ts src/core/index.ts src/core/publicTypes.ts tests/core/importBoundary.test.ts tests/core/publicApi.test.ts
git commit -m "feat: add public engine API boundary"
```

## Validation performed before packaging

```bash
npm run validate
npm audit --omit=dev
npm audit
```

Observed validation result:

```text
typecheck: passed
tests: 10 files passed, 88 tests passed
methodology audit: passed
triggered contradictions: 7/8
production dependency audit: 0 vulnerabilities
full dependency audit: 0 vulnerabilities
```

## Acceptance gate status

```text
Single public core entrypoint exists: passed
Public question DTOs exclude scoring tags: passed
Public result excludes internal numeric scoring objects: passed
Public engine output deterministic: passed
Public answer parsing and normalization available: passed
Import-boundary tests for future UI/app layers: passed
No UI/backend/AI scope introduced: passed
Full validation suite remains green: passed
```

## Known non-blocking audit note

```text
recognition_vs_independence still does not trigger in the current 16-profile audit corpus.
```

This remains non-blocking because the locked audit gate requires at least 6 contradiction rules triggered, and 7/8 currently trigger.

## Next recommended milestone

Phase 1.6 — Result Serialization + Stable Fixture Snapshots

Scope:

- add stable public-result JSON snapshots for golden profiles
- add serialization helpers for share-link/backend readiness later
- add schema/version regression checks
- keep no UI/backend/AI scope
