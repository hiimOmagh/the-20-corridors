# Phase 9.5.1 — Phase 9 Transition Plan Gate Compatibility Hotfix

## Purpose

Fix a false negative introduced by Phase 9.5: the Phase 9 transition plan still documented Phase 8 preservation, but the older Phase 9.0 copy-polish gate required the exact marker `Phase 8 closure remains green`.

## Change

- Restores the exact compatibility marker in `docs/ui/phase-9-transition-plan.md`.
- Keeps Phase 9.5 closure evidence and Phase 10 transition scope intact.
- Does not change runtime UX, persistence, database binding, rollback, production smoke, or network smoke behavior.

## Validation expectation

After applying this hotfix, the following should pass:

```powershell
npm run typecheck
npm test
npm run gate:phase9-public-result-page-copy
npm run closure:phase9
npm run validate
npm audit --omit=dev
npm audit
npm run build
```
