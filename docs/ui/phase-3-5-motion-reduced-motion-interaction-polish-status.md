# Phase 3.5 — Motion + Reduced-Motion Interaction Polish

## Status

Locked as a visual-feel pass.

## Scope

Phase 3.5 refines the interactive feel of the existing local UI without changing routes, scoring, result data, storage, or product scope.

## Changed surfaces

- primary and secondary action buttons
- A/B/C/D option cards
- answer review dots
- landing index links
- result jump links and report cards
- local share-card preview
- local feedback controls
- loading, empty, and invalid state cards

## Reduced-motion contract

Reduced-motion mode keeps visible state feedback while removing decorative movement:

- no looping sweep motion
- no large lift transforms
- no shimmer animation dependency
- selected/focus/active states remain visible through border, color, outline, and static shadow

## Explicitly unchanged

- no backend
- no database
- no AI/LLM
- no auth
- no payment
- no analytics or telemetry
- no public result links
- no image/PDF export
- no scoring methodology changes
- no new routes

## Validation commands

```text
npm run validate
npm audit --omit=dev
npm audit
npm run build
```
