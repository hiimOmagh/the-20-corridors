# Update Manifest

## Package

`the-20-corridors_phase1_4_methodology_audit.zip`

## Phase

Phase 1.4 — Methodology Audit CLI + Snapshot Evidence

## Purpose

Add a repeatable methodology audit command that validates the deterministic engine against locked golden and edge-case profiles, generates a stable JSON evidence snapshot, and reports archetype/contradiction coverage.

This package remains UI-free and backend-free. It does not add React, Next.js, CSS, database logic, AI generation, PDF export, accounts, or sharing. It strengthens the engine governance layer before any visual product shell is introduced.

## Files included

Only new or modified files are included in this update package:

```text
README.md
package.json
package-lock.json
tsconfig.test.json
docs/dev/update-manifest.md
docs/evidence/methodology-audit-latest.json
scripts/methodology-audit.ts
src/core/audit/methodologyAudit.ts
tests/core/methodologyAudit.test.ts
```

## Files intentionally not included

```text
unchanged methodology files
unchanged scoring files
unchanged report composer files
unchanged quality guard files
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
Added methodology audit core under src/core/audit/.
Added npm run audit:methodology command.
Added npm run validate command.
Added tsx dev dependency to run TypeScript audit scripts directly.
Added script that writes docs/evidence/methodology-audit-latest.json.
Added deterministic audit snapshot for golden and edge-case profiles.
Added archetype reachability coverage.
Added contradiction coverage reporting.
Added confidence distribution reporting.
Added report-quality status per fixture.
Added tests proving audit gates pass and output is deterministic.
Updated README with audit/evidence commands.
```

## Apply instructions

From repository root:

```bash
unzip -o the-20-corridors_phase1_4_methodology_audit.zip
npm install
npm run typecheck
npm test
npm run audit:methodology
npm audit --omit=dev
npm audit
git status --short
```

Then commit:

```bash
git add README.md package.json package-lock.json tsconfig.test.json docs/dev/update-manifest.md docs/evidence/methodology-audit-latest.json scripts/methodology-audit.ts src/core/audit/methodologyAudit.ts tests/core/methodologyAudit.test.ts
git commit -m "test: add methodology audit snapshot"
```

## Validation performed before packaging

```bash
npm run typecheck
npm test
npm run audit:methodology
npm audit --omit=dev
npm audit
```

Observed validation result:

```text
typecheck: passed
tests: 8 files passed, 79 tests passed
methodology audit: passed
triggered contradictions: 7/8
production dependency audit: 0 vulnerabilities
full dependency audit: 0 vulnerabilities
```

## Acceptance gate status

```text
All 20 questions present: passed
All 80 options tagged: passed
All tags known: passed
All 8 golden profiles pass expected archetype: passed
All golden expected contradictions covered: passed
All report quality guards pass: passed
At least 6 contradiction rules trigger: passed, 7/8 triggered
All 8 archetypes reachable by golden profiles: passed
Audit output deterministic across repeated runs: passed
No UI/backend/AI scope introduced: passed
```

## Known non-blocking audit note

```text
recognition_vs_independence did not trigger in the current 16-profile audit corpus.
```

This is not a Phase 1.4 blocker because the locked gate requires at least 6 contradiction rules triggered, and 7/8 currently trigger. The rule remains implemented and tested through contradiction unit coverage. A later fixture-pack phase may add a targeted profile to trigger the remaining rule if we want full corpus-level contradiction coverage.

## Next recommended milestone

Phase 1.5 — Engine Public API Boundary + Import Hygiene

Scope:

- add a single public engine entrypoint
- prevent UI layers from importing internal scoring modules later
- define stable exported types for future Next.js integration
- add import-boundary tests
- keep no UI/backend/AI scope
