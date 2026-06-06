# Phase 6.2 — Local Persistent-Link Flow Stub

## Scope

This phase adds a local persistent-link flow stub that exercises the future public-link lifecycle without adding any persistent infrastructure.

The flow is intentionally limited to:

- in-memory adapter orchestration
- minimized PublicResultDto-only records
- create/read/delete/prune lifecycle checks
- delete-token behavior validation
- local preview route awareness via `/r/preview`

## Explicit exclusions

This phase does not add:

- no backend API route
- no database
- no persistent public ID lookup route
- no authentication
- no payments
- no AI or LLM generation
- no analytics
- no browser persistence
- no network transport

## Privacy boundary

The local persistent-link flow stub stores only minimized PublicResultDto records through the in-memory adapter. Raw answers, private score internals, evidence digests, private report seeds, device identifiers, IP address data, user identity fields, and session-storage envelopes remain excluded.

## Lifecycle contract

The flow must prove:

1. a minimized DTO can be created from a public result;
2. the in-memory adapter can store that DTO under a safe anonymous public id;
3. reading after creation returns an active record;
4. an invalid delete token does not delete the record;
5. the correct delete token marks the record deleted;
6. pruning removes deleted or expired records;
7. no persistent public route, backend API route, database, auth, payment, AI, or analytics artifacts exist.

## Non-product status

This is not a public sharing feature yet. It is a local flow stub that validates the future lifecycle before any backend or persistent route is introduced.
