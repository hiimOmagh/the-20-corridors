# Phase 2 UI Readiness Contract

## Purpose

This contract defines how Phase 2 may introduce the web app UI without damaging the deterministic engine or methodology boundaries.

## Phase 2 allowed scope

Phase 2 may add:

- landing page
- instructions page
- 20-question flow
- result overview page
- full deterministic report page
- basic responsive layout
- accessible A/B/C/D selection controls
- local in-memory or browser-session answer state
- static methodology/privacy pages

Phase 2 must not add yet:

- backend persistence
- accounts/authentication
- database
- AI report generation
- payment/monetization
- friend comparison
- PDF export
- analytics trackers unless explicitly scoped

## Engine boundary rule

UI code may import only from the public core entrypoint:

```ts
import { getCorridorQuestions, runCorridorsEngine } from '../src/core';
```

or the equivalent relative path from the consuming UI file.

UI code must not import from:

```text
src/core/methodology/*
src/core/scoring/*
src/core/report/*
src/core/audit/*
src/core/release/*
src/core/serialization/*
```

## UI output rule

The UI displays the public result DTO. It must not expose raw internal numeric scoring unless a future methodology/debug mode is explicitly scoped.

## Report rendering rule

The UI may render:

- archetype
- confidence band with explanatory wording
- dominant traits
- axis cards
- contradiction cards
- strengths
- failure modes
- growth directions
- evidence digest
- disproven-if/falsifier section

The UI must preserve the disclaimer that this is a reflective game, not a clinical or diagnostic assessment.

## Phase 2 acceptance criteria

Phase 2 is acceptable only when:

```text
User can complete all 20 questions on mobile.
No login is required.
All questions come from getCorridorQuestions().
All results come from runCorridorsEngine().
No UI file imports internal scoring/methodology modules.
The report page renders every required result section.
The disclaimer is visible before or near the result.
The engine validation suite still passes.
```
