# Phase 9.4.2.1 — Quiz Interaction Gate Harmonization Hotfix

## Purpose

Phase 9.4.2 introduced the stronger real-browser interaction model for the quiz: pointer activation, click fallback, duplicate-submit suppression, `event.key` plus `event.code` keyboard parsing, stale-state refs, and a visible countdown marker.

The older Phase 9.4.1 gate still expected the first implementation shape, especially the exact `onClick={() => selectAnswer(option.key)}` token and the one-argument `parseKeyboardOptionKey(event.key)` call. That made `npm test` and `npm run validate` fail even though the stronger Phase 9.4.2 browser-interaction gate passed.

This hotfix updates the Phase 9.4.1 gate so it accepts both the original implementation and the stronger Phase 9.4.2 implementation.

## Changed behavior

No runtime behavior changes.

## Gate harmonization

The Phase 9.4.1 gate now accepts:

```text
onClick={() => selectAnswer(option.key)}
selectAnswer(option.key, 'click')
parseKeyboardOptionKey(event.key)
parseKeyboardOptionKey(event.key, event.code)
onPointerUp pointer activation
```

## Preserved checks

```text
10-second per-question timer
forced restart after timeout
hidden result hints before completion
generic answer labels
review dots hide answer keys before completion
no persistence changes
no database binding changes
no network smoke changes
```

## Expected validation

```text
npm run typecheck
npm test
npm run gate:quiz-interaction-timer-no-hints
npm run gate:quiz-browser-interaction-ux
npm run validate
npm audit --omit=dev
npm audit
npm run build
```
