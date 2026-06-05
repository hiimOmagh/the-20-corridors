# Update Manifest

## Package

`the-20-corridors_phase1_3_report_quality_guard.zip`

## Phase

Phase 1.3 — Report Quality Guard + Edge-Case Fixture Pack

## Purpose

Add regression coverage around weak profiles, repeated-letter stress inputs, motive/behavior splits, archetype collisions, and report quality.

This package remains UI-free and backend-free. It does not change the deterministic scoring engine's public output contract. It adds fixtures and quality gates that protect later UI/report work from generic, unsupported, or authority-like wording.

## Files included

Only new or modified files are included in this update package:

```text
README.md
docs/dev/update-manifest.md
src/core/methodology/edgeCaseProfiles.ts
src/core/report/qualityGuards.ts
tests/core/edgeCaseProfiles.test.ts
tests/core/reportQualityGuards.test.ts
```

## Files intentionally not included

```text
unchanged methodology files
unchanged scoring files
unchanged report composer files
unchanged package files
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
Added 8 synthetic edge-case profiles.
Added repeated-letter stress fixtures for A/B/C/D.
Added motive/behavior split fixture guarding Q20 override behavior.
Added broad mixed low-signal fixture.
Added close archetype collision fixture.
Added report quality guard utility.
Added guards against generic flattery phrases.
Added guards against forbidden authority wording.
Added guards against fallback interpretation leakage.
Added evidence-reference integrity checks across report sections.
Added regression tests for all new guards and edge-case profiles.
Updated README current phase and canonical pipeline.
```

## Apply instructions

From repository root:

```bash
unzip -o the-20-corridors_phase1_3_report_quality_guard.zip
npm run typecheck
npm test
npm audit --omit=dev
npm audit
git status --short
```

Then commit:

```bash
git add README.md docs/dev/update-manifest.md src/core/methodology/edgeCaseProfiles.ts src/core/report/qualityGuards.ts tests/core/edgeCaseProfiles.test.ts tests/core/reportQualityGuards.test.ts
git commit -m "test: add report quality guards and edge-case fixtures"
```

## Validation performed before packaging

```bash
npm run typecheck
npm test
npm audit --omit=dev
npm audit
```

Observed validation result:

```text
typecheck: passed
tests: 7 files passed, 74 tests passed
production dependency audit: 0 vulnerabilities
full dependency audit: 0 vulnerabilities
```

## Acceptance gate status

```text
Edge-case profiles build complete results: passed
Repeated-letter profiles remain answer-specific: passed
Q20 power does not override low-exposure behavior by itself: passed
Broad mixed profile avoids high confidence: passed
Archetype collision remains deterministic: passed
Report quality guard passes all golden and edge-case profiles: passed
Generic flattery corruption is detected: passed
Broken evidence references are detected: passed
No UI/backend/AI scope introduced: passed
```

## Next recommended milestone

Phase 1.4 — Methodology Audit CLI + Snapshot Evidence

Scope:

- add a small CLI/script to print scoring outputs for golden and edge-case profiles
- generate stable JSON snapshots for audit review
- expose archetype distribution and contradiction coverage
- keep the engine UI-free
- still no Next.js shell
