# Phase 8.16 — Public Result Lookup Page Preflight Contract

Phase 8.16 defines the public result lookup page database preflight criteria before any `/r/[publicId]` page can read from database persistence.

## Scope

- Define public lookup page activation and preflight flags.
- Prove API route database binding does not activate public result page lookup.
- Require complete database env.
- Keep `/r/[publicId]` page lookup disabled.
- Keep production network lookup smoke blocked.

## Explicit flags

```text
PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION=enabled
PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT=enabled
```

## Validation

```bash
npm run contract:public-lookup-page-preflight
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

## Non-goals

- No public page database read.
- No persistent `/r/[publicId]` route.
- No production mutation smoke.
- No network SQL lookup smoke.
- No AI/auth/payment/analytics/telemetry work.
