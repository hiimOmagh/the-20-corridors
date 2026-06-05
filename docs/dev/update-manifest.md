# Update Manifest

## Package

`the-20-corridors_phase1_1_scoring_engine.zip`

## Phase

Phase 1.1 — Deterministic Scoring Engine

## Purpose

Introduce the first executable scoring core for The 20 Corridors.

This package adds a TypeScript-only deterministic engine. It does not add UI, routing, styling, backend persistence, AI generation, payments, account handling, or share-card rendering.

## Files included

```text
.gitignore
README.md
package.json
package-lock.json
tsconfig.json
tsconfig.test.json
vitest.config.ts
docs/dev/update-manifest.md
src/core/methodology/tags.ts
src/core/methodology/weights.ts
src/core/methodology/questions.ts
src/core/methodology/axes.ts
src/core/methodology/archetypes.ts
src/core/methodology/contradictions.ts
src/core/methodology/goldenProfiles.ts
src/core/scoring/scoreAnswers.ts
src/core/scoring/calculateTagScores.ts
src/core/scoring/calculateAxisScores.ts
src/core/scoring/resolveArchetype.ts
src/core/scoring/detectContradictions.ts
src/core/scoring/calculateConfidence.ts
src/core/scoring/buildResult.ts
src/core/report/reportContract.ts
tests/core/scoring.test.ts
tests/core/goldenProfiles.test.ts
tests/core/contradictions.test.ts
tests/core/resultContract.test.ts
```

## Files intentionally not included

```text
node_modules/
Next.js app files
React UI components
CSS/Tailwind files
database files
AI report generation
PDF/share-card generation
```

Reason: Phase 1.1 must validate the scoring engine before any presentation layer is built.

## Apply instructions

From repository root:

```bash
unzip the-20-corridors_phase1_1_scoring_engine.zip
npm install
npm run typecheck
npm test
git status --short
```

Then commit:

```bash
git add .
git commit -m "feat: add deterministic scoring engine"
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
tests: 4 files passed, 32 tests passed
production dependency audit: 0 vulnerabilities
full dependency audit: 0 vulnerabilities
```

## Acceptance gate status

```text
All 20 questions exist: passed
All 80 answer options have tags: passed
All question weights exist: passed
Tag scoring is deterministic: passed
Axis scoring works: passed
Archetype resolution works: passed
Contradiction detection works: passed
Golden profiles run: passed
No result has empty archetype: passed
No result has empty dominantTags: passed
No result has empty axisScores: passed
No clinical/diagnostic wording exists in reportSeed: passed
```

## Next recommended milestone

Phase 1.2 — Report Composer Seed Expansion

Scope:

- convert reportSeed into structured report sections
- add strength/failure-mode generators
- add evidence-linked section builders
- keep output deterministic
- no UI yet
