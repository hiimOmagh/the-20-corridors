# Phase 8.17 — Public Result Lookup Page Dry-Run Contract

Phase 8.17 simulates future `/r/[publicId]` database lookup through a fake executor only. It does not enable the real public result page lookup route.

## Scope

- Simulate active public result lookup by public ID.
- Simulate read-miss not-found behavior.
- Simulate deleted result unavailable behavior.
- Simulate expired result unavailable behavior.
- Prove Phase 8.16 preflight remains green.
- Keep actual `/r/[publicId]` database lookup disabled.
- Keep production network lookup smoke blocked.

## Explicit flag

```text
PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN=enabled
```

## Validation

```bash
npm run dryrun:public-lookup-page
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

## Non-goals

- No real `/r/[publicId]` database read.
- No persistent public lookup route activation.
- No production network lookup smoke.
- No production mutation smoke.
- No AI/auth/payment/analytics/telemetry work.
