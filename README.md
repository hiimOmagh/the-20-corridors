# The 20 Corridors

**The 20 Corridors** is a symbolic decision-pattern web game.

Users answer 20 A/B/C/D corridor choices. The app analyzes repeated choices, contradictions, and motive signals through a deterministic scoring engine.

## Product promise

> Walk through 20 symbolic corridors. Discover the pattern behind your choices.

## What this is

A reflective personality game that maps symbolic decision patterns across:

1. Exploration vs safety-control
2. Thinking style
3. Relationship and distance pattern
4. Agency, leadership, and control
5. Ambiguity and fear response
6. Deep motive structure

## What this is not

This project is **not** a clinical, diagnostic, or scientifically validated psychological assessment.

## Current phase

**Phase 1.8 — Engine Closure Review + Phase 2 UI Readiness Contract**

This phase locks the first repeatable audit layer:

- canonical tag taxonomy
- 20-question methodology data
- weighted tag scoring
- six-axis scoring
- archetype resolution
- contradiction detection
- confidence banding
- report seed contract
- deterministic composed report sections
- evidence-linked report cards
- golden-profile tests
- synthetic edge-case fixture pack
- report quality guard
- methodology audit CLI
- stable JSON audit snapshot
- archetype distribution evidence
- contradiction coverage evidence
- public engine API boundary
- UI-safe question DTOs
- UI-safe result DTOs
- import-boundary tests
- result serialization envelope
- stable golden public-result snapshots
- snapshot verification command
- engine release gate
- repository hygiene guard
- premature UI/backend/AI scope guard
- release-gate evidence snapshot
- engine closure review
- Phase 2 UI readiness contract
- UI import-boundary contract
- Phase 2 transition plan
- Phase 2 readiness gate
- readiness evidence snapshot

## Development rule

The scoring engine must stay separate from UI code.

Canonical pipeline:

```text
Answer → Tags → Weighted Scores → Axis Scores → Contradictions → Archetype → Report Seed → Composed Report → Public API DTO → Serialization Envelope → Quality Guard → Methodology Audit Snapshot → Golden Result Snapshots → Engine Release Gate → Phase 2 Readiness Gate
```

## Commands

Install dependencies:

```bash
npm install
```

Run type checks:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Run the methodology audit and regenerate the methodology evidence snapshot:

```bash
npm run audit:methodology
```

Generate stable golden public-result snapshots:

```bash
npm run snapshots:generate
```

Verify committed golden snapshots are current:

```bash
npm run snapshots:verify
```

Run the engine release gate:

```bash
npm run release:engine
```

Run the Phase 2 readiness gate:

```bash
npm run readiness:phase2
```

Run the full local validation suite:

```bash
npm run validate
```


## Public engine API

Future UI/app layers should import the engine only from:

```ts
import { getCorridorQuestions, runCorridorsEngine } from './src/core';
```

Do not import UI code from internal methodology, scoring, report, or audit modules. The public API strips internal numeric scoring diagnostics from the UI-facing result while keeping evidence references and report sections available.

## Evidence snapshot

The latest deterministic methodology audit is written to:

```text
docs/evidence/methodology-audit-latest.json
```

The latest golden public-result snapshot is written to:

```text
docs/evidence/golden-public-results-latest.json
```

The latest engine release-gate snapshot is written to:

```text
docs/evidence/engine-release-gate-latest.json
```

The latest Phase 2 readiness snapshot is written to:

```text
docs/evidence/phase2-readiness-latest.json
```

These snapshots record:

- all locked methodology gates
- golden-profile archetype reachability
- contradiction coverage
- confidence distribution
- compact profile outputs for golden and edge-case fixtures
- report-quality status for every fixture
- serialized public outputs for all golden profiles
- schema/version evidence for future share-link/backend work
- release-gate evidence before Phase 2 UI work
- repository hygiene status for forbidden generated artifacts
- confirmation that UI/backend/AI scope has not been introduced prematurely
- engine closure review status
- Phase 2 UI contract status
- approved UI paths for the next phase
- still-blocked backend/database/AI scope for the next phase

## Package workflow

Every update should be delivered as a ZIP package containing only new or modified files.

For details, see:

```text
docs/dev/package-workflow.md
```
