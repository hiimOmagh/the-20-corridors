# Update Manifest

## Package

`the-20-corridors_phase0_methodology_lock.zip`

## Phase

Phase 0 — Methodology Lock

## Purpose

Bootstrap the repository with the locked product, methodology, UX, ethics, and package-workflow documentation.

This package contains documentation only. No application code is included.

## Files included

```text
README.md
product/blueprint.md
product/ux-principles.md
product/trust-and-ethics.md
docs/dev/package-workflow.md
docs/dev/update-manifest.md
docs/methodology/phase-0-methodology-lock.md
docs/methodology/scoring-model.md
docs/methodology/tag-taxonomy.md
docs/methodology/answer-tag-map.md
docs/methodology/axis-model.md
docs/methodology/archetypes.md
docs/methodology/contradiction-rules.md
docs/methodology/report-contract.md
docs/methodology/golden-profiles.md
```

## Files intentionally not included

```text
package.json
src/
tests/
Next.js app files
database files
AI report generation
UI components
CSS
```

Reason: Phase 0 locks methodology only. Phase 1 will introduce the deterministic scoring engine.

## Apply instructions

From the repository root:

```bash
unzip the-20-corridors_phase0_methodology_lock.zip
git status --short
```

Then commit:

```bash
git add .
git commit -m "docs: lock phase 0 methodology foundation"
```

## Validation steps

Manual validation:

1. Confirm all listed files exist.
2. Confirm no code files were added.
3. Confirm the methodology docs define all 20 questions and 80 answer mappings.
4. Confirm the trust file excludes clinical/diagnostic claims.

## Next recommended milestone

Phase 1.1 — Deterministic Scoring Engine

Scope:

- create TypeScript methodology constants
- implement tag scoring
- implement axis scoring
- implement archetype resolution
- implement contradiction detection
- implement golden-profile tests
