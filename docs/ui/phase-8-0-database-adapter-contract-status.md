# Phase 8.0 Status — Database Adapter Contract

## Status

Ready.

## Added

- `npm run contract:database-adapter`
- database adapter contract module
- database record shape for minimized `PublicResultDto`
- delete-token hash storage rule
- raw delete token exclusion rule
- `deletedAt` read/delete semantics
- migration expectations without migrations
- server-only boundary rules
- evidence snapshot for Phase 8.0

## Preserved boundaries

- Phase 7 closure remains required
- route handlers remain dry-run in-memory
- no production database client
- no migration files
- no auth implementation
- no payment implementation
- no AI implementation
- no analytics implementation
- no persistent `/r/[publicId]` lookup route
- no raw answers stored
- no private score internals stored

## Acceptance lock

Phase 8.0 is contract-only. It defines what the database adapter must look like before implementation. Production persistence is still blocked until a later phase explicitly binds a real adapter behind this contract.

## Next phase

Phase 8.1 should introduce a concrete adapter selection plan and migration design, still without silently changing the route behavior.
