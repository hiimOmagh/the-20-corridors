# Phase 8.15 Status — Database Route Rollback + Failure-Mode Evidence Pack

Status: implementation package ready.

## User-visible behavior

No user-visible behavior changes are intended in this phase.

## Operational behavior

- Default API route behavior remains memory unless explicit database activation is configured.
- Rollback to memory remains immediate through `PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK=memory`.
- Missing, invalid, or partial database activation fails closed.
- Database unavailable, write failure, and delete failure are normalized to storage-unavailable responses.
- Read miss and delete-token mismatch remain distinct route outcomes.

## Still blocked

- Public `/r/[publicId]` page database lookup.
- Public lookup activation.
- Production mutation smoke.
- Network SQL smoke.
