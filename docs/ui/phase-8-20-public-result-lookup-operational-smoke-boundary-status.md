# Phase 8.20 Status — Public Result Lookup Operational Smoke Boundary

Status: implemented as an opt-in non-production smoke boundary.

The public `/r/[publicId]` lookup implementation is now covered by an operational smoke boundary that remains safe by default.

## Guardrails

- Smoke is blocked unless `PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE=enabled`.
- Smoke is blocked unless `PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT` is non-production.
- Smoke is blocked unless `PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE=fake-executor-only`.
- Production environment smoke is rejected.
- Rollback mode blocks lookup smoke.
- Missing/invalid environment fails closed.
- Network lookup smoke remains disabled by default.

## Verified states

- Active lookup renders DTO-only public result behavior.
- Missing lookup maps to not-found behavior.
- Deleted lookup maps to unavailable behavior.
- Expired lookup maps to expired/unavailable behavior.
- Raw answers remain blocked.
- Raw delete token remains blocked.
