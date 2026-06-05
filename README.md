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

**Phase 2.6 — Landing + Methodology Trust UX**

This phase upgrades the landing page into a trust-building product entry point while preserving the current engine and UI boundaries:

- stronger hero hierarchy and clearer CTA flow into the quiz
- visible non-clinical disclaimer before the user starts
- methodology preview explaining answer-specific scoring, axes, contradictions, and falsifiers
- included/blocked scope boundary cards for current product trust
- landing presentation helper tests
- backend/database/AI/auth/payment/public-link/image-export scope remains blocked

## Development rule

The scoring engine must stay separate from UI code.

Canonical pipeline:

```text
Answer → Tags → Weighted Scores → Axis Scores → Contradictions → Archetype → Report Seed → Composed Report → Public API DTO → Serialization Envelope → Quality Guard → Methodology Audit Snapshot → Golden Result Snapshots → Engine Release Gate → UI Import Boundary → Phase 2 Readiness Gate
```

## Commands

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Create a production build:

```bash
npm run build
```

Run type checks:

```bash
npm run typecheck
```

Run tests:

```bash
npm test
```

Run the UI import-boundary guard:

```bash
npm run guard:ui-imports
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

UI/app layers must import the engine only from:

```ts
import { getCorridorQuestions, runCorridorsEngine } from '@/core';
```

Do not import UI code from internal methodology, scoring, report, audit, release, or serialization modules.

The public API strips internal numeric scoring diagnostics from the UI-facing result while keeping evidence references and report sections available.

## Current UI routes

```text
/
/quiz
/results
```

Phase 2.6 stores the last completed result as a versioned serialization envelope in `sessionStorage` only. It can still read the legacy raw public-result object written by Phase 2.0. There is no backend persistence, public share link, AI report generation, auth, payment integration, or image export yet. The landing page now includes a stronger trust/methodology preview and an explicit non-clinical scope boundary. The result page includes full report navigation, mobile summary chips, polished local-result states, reduced-motion safety rules, and an in-app local share-card preview. The quiz page includes mobile-first option hierarchy, next-unanswered navigation, review dots, and a completion panel before result generation.

## Evidence snapshots

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

These snapshots record methodology integrity, archetype reachability, contradiction coverage, serialization stability, approved UI scope, import-boundary status, and blocked backend/database/AI scope.

## Package workflow

Every update should be delivered as a ZIP package containing only new or modified files.

For details, see:

```text
docs/dev/package-workflow.md
```
