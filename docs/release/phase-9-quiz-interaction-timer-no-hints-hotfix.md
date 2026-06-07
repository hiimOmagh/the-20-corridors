# Phase 9.4.1 — Quiz Interaction Timer No-Hints Hotfix

## Scope

This hotfix repairs and hardens the quiz interaction layer before Phase 9.5 closure.

It is UI-only and does not change persistence, database binding, public lookup, rollback, or operational smoke behavior.

## Changes

- Hardened mouse/touch option selection with explicit answer-button interaction markers.
- Hardened keyboard selection through `A/B/C/D`, focused-button Enter, and focused-button Space handling.
- Added a 10-second per-question countdown timer.
- Added timeout state that blocks further answering and forces a quiz restart.
- Added restart control after timeout.
- Removed in-progress answer/result hints from quiz status and option signal copy.
- Hid selected answer letters from the question map until all questions are complete.
- Preserved result generation only after every corridor is answered.

## Explicitly not included

- No scoring change.
- No result-page change.
- No public-link persistence change.
- No database binding change.
- No network smoke change.
- No analytics, telemetry, auth, payment, or AI path.

## Validation

```bash
npm run typecheck
npm test
npm run gate:quiz-interaction-timer-no-hints
npm run validate
npm audit --omit=dev
npm audit
npm run build
```
