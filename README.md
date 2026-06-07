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

**Phase 8.5 — Database Query Contract**

This phase locks the database table and query contract without installing, importing, or binding a real database SDK/client.

- defines the `public_result_links` table contract
- defines column names and types
- defines insert/read/delete/update-expiry query intents
- defines soft-delete behavior through `deleted_at` and deleted status
- defines expired-record behavior before adapter implementation
- defines delete-token-hash lookup behavior without raw delete-token storage
- proves SQL execution remains disabled
- proves the selected SDK remains not installed and not imported
- keeps database client creation disabled
- keeps adapter factory database creation disabled
- keeps route handlers on dry-run in-memory behavior
- adds `npm run contract:database-query` and evidence at `docs/evidence/database-query-contract-latest.json`
- keeps production database client, SDK imports, migrations, auth, payment, analytics, AI, telemetry, and persistent `/r/[publicId]` lookup blocked

## Development rule

The scoring engine must stay separate from UI code.

Canonical pipeline:

```text
Answer → Tags → Weighted Scores → Axis Scores → Contradictions → Archetype → Report Seed → Composed Report → Public API DTO → Serialization Envelope → Quality Guard → Methodology Audit Snapshot → Golden Result Snapshots → Engine Release Gate → UI Import Boundary → Phase 2 Readiness Gate → UI Smoke Contract → Phase 2 Closure Gate → Visual Identity Layer → Quiz Identity Layer → Landing Consistency Layer → Motion Polish Layer → Visual Smoke Contract → Phase 3 Closure Gate → Local Export Readiness → Export QA → Export Smoke → Phase 4 Closure Gate → Public-Link Privacy Contract → Public DTO Contract → Local Public-Link Preview → Phase 5 Preview Closure Gate → Public Result Storage Contract → Backend API Boundary → Backend Route Skeleton Guard → Backend Handler Dry Run → Backend Route Runtime Smoke → Phase 7 Closure Gate → Database Adapter Contract → Database Runtime Selection Guard → Database Adapter Factory Contract → Database Client Configuration Contract → Database SDK Selection Decision Record → Database Query Contract
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

Run the Phase 8.5 database query contract gate:

```bash
npm run contract:database-query
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

These snapshots record methodology integrity, archetype reachability, contradiction coverage, serialization stability, approved UI scope, import-boundary status, local UI smoke coverage, closure readiness, backend route safety, database adapter contract safety, and blocked auth/payment/AI/analytics scope.

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

## Phase 6.2 — Local Persistent-Link Flow Stub

Phase 6.2 wires the in-memory storage adapter into a local-only persistent-link flow helper. It simulates create/read/delete/prune lifecycle behavior from a minimized `PublicResultDto` without adding backend routes, database persistence, public ID lookup routes, browser persistence, network transport, authentication, payment, analytics, or AI.

Validation now includes:

```text
npm run flow:public-link-memory
```

## Phase 6.3 — Public Link Lifecycle UI Stub

Phase 6.3 adds local-only result-page controls for a simulated public-link lifecycle. The UI creates a minimized DTO stub in component state, displays a local public ID/delete-token hash, links only to `/r/preview`, and allows local delete/reset simulation.

No backend API route, database, persistent public lookup, browser persistence, network write, authentication, payment, analytics, telemetry, or AI is introduced.

Validation now includes:

```text
npm run lifecycle:public-link-ui
```

## Phase 6.4 — Phase 6 Closure Gate + Public Link Lifecycle Smoke Contract

Phase 6.4 formally closes the local public-link lifecycle phase. It verifies that the public storage contract, in-memory adapter, local persistent-link flow, and result-page lifecycle UI all pass together while keeping the implementation local-only.

Validation now includes:

```text
npm run closure:phase6
```

The gate confirms that no backend API route, database, persistent public lookup route, browser persistence, network persistence, authentication, payment, analytics, telemetry, or AI implementation exists.


## Phase 7.0 — Backend API Boundary Contract

Phase 7.0 defines the future public-result create/read/delete API DTO boundary without implementing backend routes or persistence. The contract locks minimized `PublicResultDto` transport, delete-token rules, expiry semantics, and abuse-control expectations while keeping database, auth, payment, analytics, and AI out of scope.


## Phase 7.1 — Backend Route Skeleton Guard

Phase 7.1 defines the planned backend route skeleton for public result APIs while keeping actual route files and request handlers blocked. The validation chain now includes `npm run guard:backend-routes`.


## Phase 7.2 — Backend Handler Dry-Run

Phase 7.2 adds backend handler logic as a dry-run adapter only. It simulates public-result create/read/delete behavior against the in-memory adapter while keeping actual API route files, database persistence, auth, payment, AI, and analytics blocked.

## Phase 7.3 — Backend Route Files with Dry-Run Handlers

Phase 7.3 adds the first actual Next.js API route files for public-result links while keeping the implementation dry-run only. The routes use the in-memory adapter and return DTO-safe responses only. Database, production storage, auth, payment, AI, analytics, raw answers, and full-result transport remain blocked.

New validation command:

```bash
npm run routes:backend-handlers
```

The full `npm run validate` chain now includes this route-handler contract.


### Phase 7.4 — Backend Route Runtime Smoke Contract

Adds `npm run smoke:backend-routes` to verify actual API route files remain aligned with dry-run route helpers, preserve DTO-only responses, enforce status mapping, and keep database/auth/payment/AI/analytics out of scope.

## Phase 7.5 — Phase 7 Closure Gate + Backend Transition Plan

Phase 7.5 formally closes the dry-run backend route phase. It verifies that the backend API boundary, route skeleton guard, dry-run handler adapter, actual route handlers, and runtime smoke contract all pass together.

Validation now includes:

```text
npm run closure:phase7
```

The closure gate confirms DTO-only transport, approved API route files, delete-token response boundaries, status mapping, no raw answers/full-result transport, and no database/auth/payment/AI/analytics implementation. Phase 8 is now constrained to begin with a database adapter contract.

## Phase 8.0 — Database Adapter Contract

Phase 8.0 defines the production persistence adapter boundary without implementing production persistence. It defines the database record shape, hash-only delete-token persistence, `deletedAt` semantics, migration/version expectations, and server-only access rules while keeping route handlers in dry-run memory mode.

Validation now includes:

```text
npm run contract:database-adapter
```

## Phase 8.1 — Database Adapter Runtime Selection Guard

Phase 8.1 adds runtime selection safety before any real database client exists. Unset/default storage mode remains memory. Database mode requires explicit server-only environment values, fails closed when incomplete, and remains contract-only even when complete. Route handlers do not silently switch to a real database adapter.

Validation now includes:

```text
npm run guard:database-runtime-selection
```

## Phase 8.2 — Database Adapter Factory Contract

Phase 8.2 adds the adapter factory boundary that will eventually instantiate the selected public-result storage adapter. The factory exists before any real database client and keeps database mode contract-only. Route handlers resolve through the factory, but only memory mode may bind to routes.

Validation now includes:

```text
npm run contract:database-adapter-factory
```

The factory confirms memory remains the default, configured database mode does not create an adapter, database route binding remains blocked, and no Supabase/Prisma/Drizzle client, migration, auth, payment, AI, analytics, telemetry, or persistent `/r/[publicId]` route exists.

## Phase 8.3 — Database Client Configuration Contract

Phase 8.3 centralizes the future database-client configuration contract before any real database SDK is imported. It validates server-only database env names, blocks `NEXT_PUBLIC_` database env leakage, and keeps database URL/service-key validation contract-only.

Validation now includes:

```text
npm run contract:database-client-config
```

The contract confirms that no production database client exists, the adapter factory still cannot create a database adapter, and routes still use memory/dry-run behavior.



## Phase 8.4 — Database SDK Selection Decision Record

Phase 8.4 locks the future database SDK decision without installing, importing, or binding a real database client. It selects PostgreSQL with future `@neondatabase/serverless`, documents rejected alternatives and failure modes, and keeps factory/database route binding blocked.

Validation now includes:

```text
npm run contract:database-sdk-decision
```


## Phase 8.5 — Database Query Contract

Phase 8.5 defines the future PostgreSQL query contract before installing or importing `@neondatabase/serverless`. It defines the `public_result_links` table, explicit columns, non-executable insert/read/delete/update-expiry intents, soft-delete semantics, expired-record behavior, and delete-token-hash lookup rules.

Validation now includes:

```text
npm run contract:database-query
```

The contract confirms that no SQL execution exists, no SDK is installed/imported, the factory still cannot create a database adapter, and routes still use memory/dry-run behavior.

## Phase 8.6 — Database SDK Install + Client Smoke Boundary

Phase 8.6 installs and locks `@neondatabase/serverless` after the SDK decision and query contracts are already green.

Current persistence status:

- `@neondatabase/serverless` is installed and locked.
- The SDK import exists only in `src/core/public-link/publicResultDatabaseClientSmokeBoundary.ts`.
- The client smoke boundary is server-only and non-network.
- Missing/invalid/public database env fails closed before client creation.
- Complete database env can create a smoke-only Neon query function without executing SQL.
- No SQL mutation is executed.
- No database-backed adapter exists yet.
- Factory route binding for database mode remains blocked.
- Public-result routes still use memory/dry-run behavior.

Run the Phase 8.6 gate:

```text
npm run smoke:database-client
```

## Phase 8.7 — Database Client Query Readiness Guard

Phase 8.7 adds server-only parameterized query descriptor builders for the future database adapter. The helpers map to the Phase 8.5 query intents while keeping SQL execution, network smoke, adapter persistence, and route binding disabled.

Validation now includes:

```text
npm run guard:database-query-readiness
```

The guard confirms placeholder/value alignment, no raw string interpolation for user-controlled values, no mutation smoke against production DB, SDK import still confined to the Phase 8.6 smoke boundary, and routes still using memory/dry-run behavior.

## Phase 8.8 — Database Adapter Implementation Behind Disabled Factory Gate

Phase 8.8 adds the first server-only database adapter implementation while keeping activation disabled. The adapter maps create/read/delete/prune methods to the Phase 8.5 query intents through the Phase 8.7 parameterized descriptors. All SQL execution remains behind explicit adapter methods. Factory route binding remains blocked and routes still use memory/dry-run behavior.


## Phase 8.9 — Database Adapter Activation Dry-Run Gate

Phase 8.9 adds a controlled activation dry-run for the database adapter. The adapter can be selected and exercised through a fake executor, proving the implementation path without enabling production persistence.

Run the Phase 8.9 gate:

```bash
npm run dryrun:database-adapter-activation
```

The dry-run keeps factory route binding disabled, keeps public routes in memory/dry-run behavior, executes no network query, performs no production mutation smoke, and introduces no persistent `/r/[publicId]` lookup.

## Phase 8.10 — Database Adapter Factory Activation Contract

Phase 8.10 adds controlled factory-level database adapter construction for explicit non-route activation contexts only. It does not activate database persistence for public API routes.

Validation now includes:

```text
npm run contract:database-factory-activation
```

Current persistence status:

- Explicit non-route activation can construct the database adapter through an injected executor.
- `PUBLIC_RESULT_STORAGE_MODE=database` alone is not enough to bind routes or create a route adapter.
- Route-handler context still fails closed for database adapter construction.
- Public result API routes still use memory/dry-run behavior.
- No production mutation smoke is allowed.
- No network SQL execution is performed.
- No persistent `/r/[publicId]` lookup exists.

## Phase 8.11 — Public Route Database Binding Preflight Contract

Phase 8.11 defines the public route database-binding preflight criteria before any public API route can bind to database persistence.

`PUBLIC_RESULT_STORAGE_MODE=database` alone remains insufficient. The preflight requires complete database env, the explicit `PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT=enabled` flag, and an acknowledgement that production route binding remains disabled.

Run the Phase 8.11 gate:

```bash
npm run contract:route-database-binding-preflight
```

The gate confirms that the factory activation contract remains green, route handlers still use memory/dry-run behavior, no production mutation smoke runs, no network SQL executes, and no persistent `/r/[publicId]` lookup is introduced.

## Phase 8.12 — Public Route Database Binding Dry-Run Contract

Phase 8.12 simulates route-level database binding through a fake executor only. The dry-run can inject a database adapter into the route handler functions for create/read/delete/prune simulation, while the actual public route adapter resolver remains memory/dry-run.

Validation now includes:

```text
npm run dryrun:route-database-binding
```

Current persistence status:

- Route database binding dry-run contract exists.
- Preflight contract remains green.
- Fake route-bound database adapter can execute create/read/delete/prune simulation.
- Actual public route handlers still use memory/dry-run behavior.
- No production mutation smoke runs.
- No network SQL executes.
- No persistent `/r/[publicId]` lookup exists.

## Phase 8.13 — Public Route Database Binding Activation Contract

Phase 8.13 defines the API route database-binding activation decision without applying production route persistence. The activation contract requires the Phase 8.11 preflight, Phase 8.12 fake-executor dry-run, and the explicit `PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION=enabled` flag.

Run the Phase 8.13 gate:

```bash
npm run contract:route-database-binding-activation
```

Current persistence status:

- API route database binding activation decision can become ready.
- Actual route handlers remain memory/dry-run.
- Public `/r/[publicId]` page lookup remains separate and blocked.
- Production mutation smoke remains blocked.
- Network SQL execution remains blocked.
- Persistent public result page lookup remains absent.


## Phase 8.14 — Public API Route Database Binding Implementation Gate

Phase 8.14 wires the public API route storage resolver behind explicit database-binding activation controls. Memory remains the default, `PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK=memory` provides immediate rollback, and public `/r/[publicId]` page lookup remains separate and blocked.

Run the Phase 8.14 gate:

```bash
npm run gate:api-route-database-binding
```

## Phase 8.15 — Database Route Rollback + Failure-Mode Evidence Pack

Phase 8.15 hardens API route database-binding operations before any public lookup activation. It adds explicit rollback and failure-mode evidence for the database-bound API route path while keeping `/r/[publicId]` page lookup separate and blocked.

Run the Phase 8.15 evidence pack:

```bash
npm run evidence:database-route-failures
```

The evidence pack verifies rollback to memory, missing-env fail-closed behavior, invalid-env fail-closed behavior, partial activation fail-closed behavior, database unavailable behavior, write failure behavior, read miss behavior, delete-token mismatch behavior, and delete failure behavior.

Current persistence status:

- API route database binding remains behind explicit activation and implementation controls.
- `PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK=memory` immediately selects memory mode.
- Missing/invalid/partial database activation returns storage-unavailable instead of pretending persistence is active.
- Database unavailable, write failure, and delete failure are normalized to storage-unavailable route responses.
- Read miss returns not-found.
- Delete-token mismatch returns invalid-delete-token.
- No production mutation smoke runs.
- No network SQL execution runs.
- Public `/r/[publicId]` page lookup remains blocked.

## Phase 8.16 — Public Result Lookup Page Preflight Contract

Phase 8.16 defines the public `/r/[publicId]` lookup-page database preflight criteria without enabling the page lookup. API route database binding does not automatically activate public result-page database reads.

Run the Phase 8.16 preflight contract:

```bash
npm run contract:public-lookup-page-preflight
```

Current persistence status:

- Public lookup page preflight requires `PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION=enabled`.
- Public lookup page preflight also requires `PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT=enabled`.
- Complete database env remains required.
- API route database binding can be active while public lookup remains blocked.
- Public `/r/[publicId]` page database lookup remains disabled by default.
- No public page database read is executed.
- No production network lookup smoke runs.
- No persistent `/r/[publicId]` route is introduced.

## Phase 8.17 — Public Result Lookup Page Dry-Run Contract

Phase 8.17 simulates future public `/r/[publicId]` database lookup behavior through a fake executor only. It keeps the real public result page lookup disabled while proving active, missing, deleted, and expired lookup states.

Run the Phase 8.17 dry-run contract:

```bash
npm run dryrun:public-lookup-page
```

Current persistence status:

- Public lookup page dry-run requires `PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN=enabled`.
- Phase 8.16 preflight must remain green.
- Fake lookup adapter resolves an active public DTO by public ID.
- Read miss returns not-found behavior.
- Deleted and expired results render unavailable states without DTO exposure.
- Actual `/r/[publicId]` page database lookup remains disabled.
- No production network lookup smoke runs.
- No persistent public lookup route is introduced.

## Phase 8.18 — Public Result Lookup Page Activation Contract

Phase 8.18 defines the production-safe activation decision for future `/r/[publicId]` database lookup. It keeps the decision separate from actual page route implementation and preserves API route rollback behavior.

Run the Phase 8.18 activation contract:

```bash
npm run contract:public-lookup-page-activation
```

Current persistence status:

- Public lookup page activation requires `PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION=enabled`.
- Phase 8.17 dry-run must remain green.
- API route database binding gate must remain green.
- Rollback/failure evidence must remain green.
- Rollback mode blocks public lookup activation.
- Actual `/r/[publicId]` page database lookup remains not applied.
- No real public page database read is executed.
- No production network lookup smoke runs.
- No public page route implementation is introduced.

## Phase 8.19 — Public Result Lookup Page Implementation Gate

Phase 8.19 implements the public `/r/[publicId]` lookup page behind the Phase 8.18 activation decision. The route implementation uses the grouped Next.js path `src/app/r/(public)/[publicId]/page.tsx`, which resolves to `/r/[publicId]` while keeping earlier unapproved-route guards precise.

Run the Phase 8.19 implementation gate:

```bash
npm run gate:public-lookup-page-implementation
```

Current persistence status:

- The public lookup page is implemented but remains activation-gated.
- Default behavior is a safe disabled fallback.
- `PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK=memory` blocks page database lookup.
- Missing or invalid database configuration fails closed before database read.
- Active public results can render DTO-only public fields.
- Missing, deleted, and expired results render non-DTO unavailable states.
- Raw answers and raw delete tokens remain blocked.
- Production network lookup smoke is not executed by default.
