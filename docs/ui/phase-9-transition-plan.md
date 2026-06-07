# Phase 9 Transition Plan — Post-Persistence Product Hardening

Phase 9 starts after Phase 8 public lookup release closure. The transition is intentionally separate from the Phase 8 persistence implementation so that database persistence, public lookup rendering, rollback, and operational smoke remain governed by their existing evidence gates.

## Current locked baseline

- API route database binding exists behind explicit activation and rollback controls.
- Public `/r/[publicId]` lookup route exists behind explicit activation and rollback controls.
- Operational smoke is opt-in, non-production, and fake-executor-only by default.
- Production network lookup smoke remains disabled by default.
- Rollback disables both API route database persistence and public lookup rendering.
- Public DTO-only rendering is preserved.
- Raw answers and raw delete tokens remain blocked.

## Phase 9.0 — Public Result Page UX + Operational Copy Polish

Scope:

- Polish renderable public result copy.
- Polish not-found copy.
- Polish deleted-result copy.
- Polish expired-result copy.
- Polish disabled/rollback copy.
- Polish configuration-error and storage-unavailable copy.
- Preserve DTO-only rendering.
- Preserve Phase 8 closure and operational evidence.

Acceptance gate:

```text
Public result page user-facing states are polished.
Renderable, not-found, deleted, expired, disabled, configuration-error, and storage-unavailable states have clear copy.
Raw answers remain blocked.
Raw delete tokens remain blocked.
Operational smoke remains opt-in only.
Rollback drill remains green.
Phase 8 closure remains green.
Full validate remains green.
Build remains green.
```

## Future candidate scope

After Phase 9.0, the next useful product-hardening moves are:

- share/copy UX around public links
- operational runbook documentation
- environment setup documentation
- release checklist consolidation
- non-production smoke playbooks

## Scope boundaries

Phase 9 must not silently change the Phase 8 persistence contract.

Any production network smoke, destructive database operation, account system, payment path, analytics, telemetry, or generated-AI feature must enter through a separate explicit gate with its own rollback and failure-mode evidence.
