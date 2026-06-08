# Phase 9.4.2 — Quiz Browser Interaction UX Hotfix

## Status

Phase 9.4.2 hardens the actual browser interaction path before the Phase 9 UX closure gate.

This is not a persistence, database, public lookup, rollback, or network-smoke change.

## Problem corrected

Manual testing showed the quiz could still feel non-interactive in the browser:

- answer clicks did not reliably select an answer;
- keyboard shortcuts could select inaccurately under stale state;
- the 10-second timer was not reliably visible during manual dev testing;
- Next.js dev resources were blocked when testing through `172.21.48.1`.

## Corrections

- Added `allowedDevOrigins: ['172.21.48.1']` for the observed dev host.
- Added an explicit browser workflow marker: `data-quiz-workflow="timed-interactive"`.
- Added an explicit visible countdown marker: `data-quiz-countdown="visible"`.
- Added pointer activation for answer buttons.
- Kept click fallback while suppressing pointer/click double submission.
- Added stale-closure protection through refs for answers, current question index, and timeout state.
- Expanded keyboard matching to use both `event.key` and `event.code`.
- Preserved the 10-second timeout/restart rule.
- Preserved no-hints-before-completion behavior.

## Non-goals

- No result scoring changes.
- No report-generation changes.
- No public result lookup changes.
- No persistence changes.
- No database binding changes.
- No network smoke changes.
