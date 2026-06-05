# Update Manifest

## Package

`the-20-corridors_phase1_7_engine_release_gate.zip`

## Phase

Phase 1.7 — Engine Release Gate + Repository Hygiene Guard

## Purpose

Add a single pre-Phase-2 release gate for the deterministic engine. The gate verifies that methodology evidence and golden public-result snapshots are current, that no forbidden generated artifacts are present, and that UI/backend/AI scope has not been introduced before the engine layer is formally closed.

This package remains UI-free and backend-free. It does not add React, Next.js, CSS, database logic, AI generation, PDF export, accounts, or sharing.

## Files included

Only new or modified files are included in this update package:

```text
README.md
package.json
docs/dev/update-manifest.md
docs/evidence/engine-release-gate-latest.json
scripts/engine-release-gate.ts
src/core/release/releaseGate.ts
tests/core/releaseGate.test.ts
```

## Files intentionally not included

```text
unchanged methodology files
unchanged scoring files
unchanged report composer files
unchanged quality guard files
unchanged audit files
unchanged public API files
unchanged serialization files
unchanged existing tests
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
Added npm run release:engine.
Updated npm run validate to run the engine release gate after typecheck and tests.
Added engine release-gate core report.
Added repository hygiene scan for generated artifacts.
Added premature UI/backend/AI scope guard.
Added release-gate evidence snapshot at docs/evidence/engine-release-gate-latest.json.
Added release-gate regression tests.
Updated README with release-gate workflow and evidence location.
```

## Engine release-gate checks

```text
methodology audit passes
methodology evidence snapshot is current
golden public-result snapshots are current
no forbidden generated artifacts exist
no premature UI/backend/AI scope exists
package.json exposes npm run release:engine
npm run validate includes npm run release:engine
```

## Apply instructions

From repository root:

```bash
unzip -o the-20-corridors_phase1_7_engine_release_gate.zip
npm run validate
npm audit --omit=dev
npm audit
git status --short
```

Then commit:

```bash
git add README.md package.json docs/dev/update-manifest.md docs/evidence/engine-release-gate-latest.json scripts/engine-release-gate.ts src/core/release/releaseGate.ts tests/core/releaseGate.test.ts
git commit -m "test: add engine release gate"
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
tests: 13 files passed, 101 tests passed
engine release gate: passed
methodology audit: passed
methodology evidence current: yes
golden snapshots current: yes
forbidden generated artifacts: 0
premature scope artifacts: 0
production dependency audit: 0 vulnerabilities
full dependency audit: 0 vulnerabilities
```

## Acceptance gate status

```text
Single engine release-gate command exists: passed
validate runs release gate: passed
methodology audit verified by release gate: passed
methodology evidence freshness verified: passed
golden snapshot freshness verified: passed
forbidden generated artifact guard exists: passed
premature UI/backend/AI guard exists: passed
release-gate evidence file exists: passed
No UI/backend/AI scope introduced: passed
```

## Known non-blocking audit note

```text
recognition_vs_independence still does not trigger in the current 16-profile audit corpus.
```

This remains non-blocking because the locked audit gate requires at least 6 contradiction rules triggered, and 7/8 currently trigger.

## Next recommended milestone

Phase 1.8 — Engine Closure Review + Phase 2 UI Readiness Contract

Scope:

- create a concise engine closure document
- define the Phase 2 UI contract against the public engine API
- define allowed UI directory structure and import rules for Phase 2
- remove/relax the temporary no-UI release gate only when Phase 2 begins
- still no UI implementation in the closure package
