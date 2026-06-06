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

**Phase 6.0 — Persistent Public Result Link Storage Contract**

This phase defines the storage boundary for future persistent public result links without implementing storage infrastructure.

- defines `PublicResultStorageAdapter` as the future persistence seam
- locks minimized `PublicResultDto` as the only allowed stored payload
- defines anonymous non-sequential public ID, delete-token hash, and default expiry policies
- adds `npm run contract:public-storage` and evidence at `docs/evidence/public-result-storage-latest.json`
- keeps backend, API routes, database, auth, payment, analytics, telemetry, AI, and persistent public route lookup blocked

## Development rule

The scoring engine must stay separate from UI code.

Canonical pipeline:

```text
Answer → Tags → Weighted Scores → Axis Scores → Contradictions → Archetype → Report Seed → Composed Report → Public API DTO → Serialization Envelope → Quality Guard → Methodology Audit Snapshot → Golden Result Snapshots → Engine Release Gate → UI Import Boundary → Phase 2 Readiness Gate → UI Smoke Contract → Phase 2 Closure Gate → Visual Identity Layer → Quiz Identity Layer → Landing Consistency Layer → Motion Polish Layer → Visual Smoke Contract → Phase 3 Closure Gate → Local Export Readiness → Export QA → Export Smoke → Phase 4 Closure Gate → Public-Link Privacy Contract → Public DTO Contract → Local Public-Link Preview → Phase 5 Preview Closure Gate → Public Result Storage Contract
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

Run the UI smoke contract:

```bash
npm run smoke:ui
```

Run the Phase 2 closure gate:

```bash
npm run closure:phase2
```

Run the Phase 3 visual smoke contract:

```bash
npm run smoke:visual
```

Run the Phase 3 closure gate:

```bash
npm run closure:phase3
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

Phase 3.5 still stores the last completed result as a versioned serialization envelope in `sessionStorage` only. It can still read the legacy raw public-result object written by Phase 2.0. There is no backend persistence, public share link, AI report generation, auth, payment integration, analytics, or image export yet. The landing page includes a visual identity preview, section-index navigation, continuity markers, compact trust signals, trust/methodology preview, and explicit non-clinical scope boundary. The result page includes full report navigation, mobile summary chips, polished local-result states, reduced-motion safety rules, an upgraded in-app local share-card preview, and a local-only feedback UX stub. The upgraded local share card exposes a corridor signature, card metrics, visual evidence cues, and Discord/chat-readable copy text while remaining purely local. The result report now applies consistent section tones, numbered jump anchors, and a visual section index across axis, contradiction, practical, evidence, trust, feedback, and share sections. The quiz page includes mobile-first option hierarchy, next-unanswered navigation, review dots, and a completion panel before result generation. The local UI remains covered by a smoke contract, Phase 2 closure gate, Phase 3 visual smoke contract, and Phase 3 closure gate.

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

The latest UI smoke contract snapshot is written to:

```text
docs/evidence/ui-smoke-contract-latest.json
```

The latest Phase 2 closure snapshot is written to:

```text
docs/evidence/phase2-closure-latest.json
```

The latest Phase 3 visual smoke snapshot is written to:

```text
docs/evidence/visual-smoke-contract-latest.json
```

The latest Phase 3 closure snapshot is written to:

```text
docs/evidence/phase3-closure-latest.json
```

These snapshots record methodology integrity, archetype reachability, contradiction coverage, serialization stability, approved UI scope, import-boundary status, local UI smoke coverage, closure readiness, and blocked backend/database/AI scope.

## Package workflow

Every update should be delivered as a ZIP package containing only new or modified files.

For details, see:

```text
docs/dev/package-workflow.md
```

## Phase 3.3 — Quiz Visual Identity Pass

Changed/new files:

```text
README.md
docs/dev/update-manifest.md
docs/ui/phase-3-3-quiz-visual-identity-pass-status.md
src/app/globals.css
src/features/quiz/QuizClient.tsx
src/features/quiz/quizVisualIdentity.ts
tests/ui/quizVisualIdentity.test.ts
```

Validation:

```text
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

Scope: quiz visual identity frame, option signal labels, answer-map rhythm, completion/review visual polish, reduced-motion-safe CSS, and helper tests only. No scoring changes, keyboard/mobile behavior changes, image export, public result links, backend, database, AI/LLM, auth, payments, analytics, or telemetry.
## Phase 3.5 — Motion + Reduced-Motion Interaction Polish

Changed/new files:

```text
README.md
docs/dev/update-manifest.md
docs/ui/phase-3-5-motion-reduced-motion-interaction-polish-status.md
src/app/globals.css
src/features/visual/motionPolish.ts
tests/ui/motionPolish.test.ts
```

Validation:

```text
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

Scope: subtle interaction polish, hover/focus/active state consistency, mobile tap-state safety, reduced-motion rules, and motion helper tests only. No new routes, export behavior, backend, database, AI/LLM, auth, payments, analytics, telemetry, public result links, or scoring methodology changes.


## Phase 3.6 — Phase 3 Closure Gate → Local Export Readiness → Export QA → Export Smoke → Phase 4 Closure Gate → Public-Link Privacy Contract → Public DTO Contract → Local Public-Link Preview → Phase 5 Preview Closure Gate → Public Result Storage Contract + Visual Smoke Contract

Changed/new files:

```text
README.md
package.json
docs/dev/update-manifest.md
docs/evidence/engine-release-gate-latest.json
docs/evidence/phase2-readiness-latest.json
docs/evidence/ui-smoke-contract-latest.json
docs/evidence/phase2-closure-latest.json
docs/evidence/visual-smoke-contract-latest.json
docs/evidence/phase3-closure-latest.json
docs/release/phase-3-closure-review.md
docs/ui/phase-3-6-phase-3-closure-gate-visual-smoke-contract-status.md
docs/ui/phase-4-transition-plan.md
scripts/visual-smoke-contract.ts
scripts/phase3-closure-gate.ts
src/core/release/visualSmokeContract.ts
src/core/release/phase3ClosureGate.ts
tests/core/visualSmokeContract.test.ts
tests/core/phase3ClosureGate.test.ts
```

Validation:

```text
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

Scope: formal Phase 3 closure, visual smoke coverage, reduced-motion/local-only boundary verification, Phase 4 transition planning, and evidence snapshots only. No backend, database, AI/LLM, auth, payments, analytics, telemetry, public result links, image/PDF export, or scoring methodology changes.

## Phase 4.0 — Local Result Export Readiness Contract

Changed/new files:

```text
README.md
package.json
docs/dev/update-manifest.md
docs/evidence/local-export-readiness-latest.json
docs/release/phase-4-local-result-export-readiness-contract.md
docs/ui/phase-4-0-local-result-export-readiness-contract-status.md
scripts/local-export-readiness.ts
src/core/release/localExportReadiness.ts
tests/core/localExportReadiness.test.ts
```

Validation:

```text
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

Scope: export-readiness contract only. Defines local-only export boundaries, blocks raw-answer leakage, blocks full result serialization export, and prepares future local image export from the share-card surface without implementing image/PDF export, backend, AI/LLM, auth, payment, analytics, telemetry, database, or public links.

## Phase 4.1 — Local Share Card Image Export Prototype

Changed/new files:

```text
README.md
docs/dev/update-manifest.md
docs/evidence/local-export-readiness-latest.json
docs/release/phase-4-local-result-export-readiness-contract.md
docs/ui/phase-4-1-local-share-card-image-export-prototype-status.md
scripts/local-export-readiness.ts
src/app/globals.css
src/core/release/localExportReadiness.ts
src/features/results/ResultsClient.tsx
src/features/results/resultShareImageExport.ts
tests/core/localExportReadiness.test.ts
tests/ui/resultShareImageExport.test.ts
```

Validation:

```text
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

Scope: local-only PNG export from the compressed share-card surface, SVG/canvas browser-local rendering, export status copy, and readiness tests. No backend, database, AI/LLM, auth, payments, analytics, telemetry, public result links, PDF export, full-result serialization export, or answer-level export surface.

## Phase 4.2 — Export UX Hardening + Failure-State Polish

Changed/new files:

```text
README.md
docs/dev/update-manifest.md
docs/evidence/local-export-readiness-latest.json
docs/release/phase-4-local-result-export-readiness-contract.md
docs/ui/phase-4-2-export-ux-hardening-failure-state-polish-status.md
src/app/globals.css
src/core/release/localExportReadiness.ts
src/features/results/ResultsClient.tsx
src/features/results/resultShareImageExport.ts
tests/core/localExportReadiness.test.ts
tests/ui/resultShareImageExport.test.ts
```

Validation:

```text
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

Scope: hardens the local PNG export prototype with visible filename, dimensions, browser capability, fallback/failure-state copy, and privacy-boundary details. Still no backend, database, AI/LLM, auth, payments, analytics, telemetry, public links, PDF export, full-result serialization export, or raw-answer export.

## Phase 4.3 — Export Visual QA + Download Contract

Phase 4.3 adds a local export QA gate for the share-card PNG surface.

Run:

```bash
npm run qa:export-visual
```

The gate verifies:

- SVG dimensions: `1200 × 1600`.
- SVG viewBox: `0 0 1200 1600`.
- Required visible labels and local-only boundary text.
- XML escaping for unsafe text.
- Stable download filename contract.
- No raw-answer leakage.
- No backend, database, AI, auth, payment, analytics, telemetry, or persistence signals.

The gate is included in:

```bash
npm run validate
```

## Phase 4.4 — Phase 4 Closure Gate + Export Smoke Contract

Phase 4.4 closes the local export phase with a formal export smoke contract and Phase 4 closure gate.

Run:

```bash
npm run smoke:export
npm run closure:phase4
```

The gates verify:

- `readiness:export` and `qa:export-visual` still pass.
- The export action surface remains local to the browser.
- The PNG export uses the visible share-card summary only.
- Runtime signals for SVG/canvas/download behavior remain present.
- Raw answers and full result serialization are not exposed through export.
- No backend, database, AI, auth, payment, analytics, telemetry, persistence, or public-link scope is introduced.

The full validation chain now includes:

```bash
npm run smoke:export
npm run closure:phase4
```

## Phase 5.0 — Public Result Link Privacy Contract

Phase 5.0 defines the privacy contract for future public result links without implementing public-link infrastructure.

Run:

```bash
npm run privacy:public-link
```

The gate verifies:

- Phase 4 closure remains valid.
- A minimized `PublicResultDto` contract exists.
- Raw answers are never persisted for public links.
- Anonymous result IDs are unguessable and not derived from answers.
- Delete-token and default-expiry expectations are defined.
- Future public-link smoke expectations are defined before implementation.
- No backend, database, auth, payment, AI, analytics, telemetry, persistence, or public-link route has been introduced.

The full validation chain now includes:

```bash
npm run privacy:public-link
```

## Phase 5.1 — Public Result DTO Builder Contract

Phase 5.1 adds a minimized public result DTO builder. The builder derives from the public engine result and externally supplied anonymous metadata, excludes raw choices/private scoring internals, and does not add backend storage, public routes, authentication, payment, or AI.

Validation includes `npm run contract:public-dto` through `npm run validate`.


### Phase 5.2 — Local public-link preview route stub

Adds `/r/preview` as a local-only simulation of a future public result link. It renders the minimized `PublicResultDto` from the browser session result only. No persistence, backend API, database, auth, payment, analytics, AI, or public result lookup is introduced.

### Phase 5.3 — Public-link preview UX polish + route smoke upgrade

Phase 5.3 polishes the local `/r/preview` route and upgrades route smoke coverage to include the public-link preview surface. The route remains a local-only DTO preview: no persistence, public ID lookup, backend API, database, auth, payment, analytics, telemetry, or AI is introduced.

Validation keeps using:

```bash
npm run preview:public-link
npm run smoke:ui
npm run validate
```

The updated checks verify DTO-only rendering, polished empty/invalid states, preview-section navigation, public preview metric cards, route smoke signals for `/r/preview`, and absence of raw choices/private internals.

## Phase 5.4 — Public-Link Preview Closure Gate

Phase 5.4 closes the local public-link preview phase. The `/r/preview` route remains a local-session DTO preview only; no persistent public result ID lookup, backend API, database, authentication, payment, analytics, telemetry, or AI is introduced.

Run:

```bash
npm run closure:phase5
```

The gate verifies:

- Phase 4 closure still passes.
- `privacy:public-link`, `contract:public-dto`, and `preview:public-link` all pass.
- `/r/preview` remains the only public-link preview route.
- The preview surface is DTO-only and excludes raw choices/private internals.
- No persistent public result route, backend API, database, auth, payment, AI, analytics, telemetry, or public ID lookup exists.

The full validation chain now includes:

```bash
npm run closure:phase5
```

## Phase 6.0 — Persistent Public Result Link Storage Contract

Phase 6.0 defines the contract for future persistent public links. It introduces a storage adapter interface and record helpers, but deliberately avoids backend/database implementation. Stored records are limited to minimized `PublicResultDto` payloads plus anonymous metadata, expiry, delete-token hash, and status.

Validation is covered by `npm run contract:public-storage`.


## Phase 6.1 — In-Memory Public Result Storage Adapter

Phase 6.1 implements the first `PublicResultStorageAdapter` using memory only. It exercises create/read/delete/prune behavior, duplicate public-id rejection, delete-token hash verification, expired/deleted/not-found states, and DTO-only record preservation.

Scope remains local and non-persistent: no database, no backend API route, no persistent public route lookup, no browser persistence, no network persistence, no auth/payment/AI/analytics.

Validation now includes:

```text
npm run adapter:public-storage-memory
```
