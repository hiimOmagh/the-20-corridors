# Phase 8.21 Status — Public Lookup Operational Rollback Drill

Status: implementation package prepared.

The Phase 8.21 drill verifies rollback behavior across API route persistence and public lookup rendering in one operational proof.

## Verified behavior

- API route database binding is selected before rollback.
- Public lookup renders an active DTO-only result before rollback.
- Operational smoke is green before rollback.
- `PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK=memory` forces API route storage back to memory.
- The same rollback flag disables public lookup rendering.
- Rollback exposes no stale database DTO.
- Missing, deleted, and expired states remain DTO-free after rollback.
- Raw answers remain blocked.
- Raw delete tokens remain blocked.
- Production network lookup smoke remains disabled by default.

## Gate

```bash
npm run drill:public-lookup-rollback
```
