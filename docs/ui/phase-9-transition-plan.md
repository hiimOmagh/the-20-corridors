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

## Phase 9.1 — Public Result Share/Copy UX Polish

Scope:

- Improve public result share/copy guidance.
- Make the copy-link affordance clearer.
- Add manual copy fallback guidance.
- Prevent unavailable states from offering invalid copy actions.
- Preserve DTO-only rendering.
- Preserve Phase 9.0 copy evidence and Phase 8 closure.

Acceptance gate:

```text
Share/copy UX copy exists for the public result page.
Copy-link affordance text is clearer.
Fallback/manual copy guidance exists.
Unavailable states do not offer invalid copy action.
Raw answers remain blocked.
Raw delete tokens remain blocked.
No persistence behavior changes.
No database binding changes.
No network smoke changes.
Phase 8 closure remains green.
Phase 9.0 copy gate remains green.
Full validate remains green.
Build remains green.
```

## Phase 9.2 — Public Result Page Accessibility Semantics Polish

Scope:

- Add explicit main landmark labelling for `/r/[publicId]`.
- Add accessible heading and region semantics for renderable public result content.
- Add status/error live-region semantics for unavailable states.
- Add accessible share/copy label and help text.
- Keep unavailable states non-actionable.
- Preserve Phase 8 closure, Phase 9.0 copy polish, and Phase 9.1 share/copy UX evidence.

Acceptance gate:

```text
Accessible heading hierarchy exists.
Main landmark is explicit.
Status/error states use appropriate semantic text.
Renderable result has clear region labels.
Copy/share action has accessible label/help text.
Unavailable states remain non-actionable.
Raw answers remain blocked.
Raw delete tokens remain blocked.
No persistence behavior changes.
No database binding changes.
No network smoke changes.
Phase 8 closure remains green.
Phase 9.0 and 9.1 gates remain green.
Full validate remains green.
Build remains green.
```
