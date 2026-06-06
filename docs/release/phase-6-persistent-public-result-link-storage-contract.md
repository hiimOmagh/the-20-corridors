# Phase 6.0 — Persistent Public Result Link Storage Contract

## Purpose

Phase 6.0 defines the storage contract for future persistent public result links.

This is a contract-only phase. There is no backend implementation in Phase 6.0 and no database implementation in Phase 6.0.

## Storage payload rule

Persistent result storage may store minimized PublicResultDto only.

The storage layer must not persist raw choices, private scoring internals, methodology internals, full result serialization envelopes, private report seeds, or device/user identity data.

## Adapter contract

The future storage boundary is represented by `PublicResultStorageAdapter`.

The adapter must support:

1. create a public result record
2. read by anonymous non-sequential result id
3. delete by delete-token proof
4. prune expired records

## Public id policy

Every persistent public result must use an anonymous non-sequential result id.

The public id must be:

- unguessable
- not derived from answers
- not derived from user identity
- not incremental
- long enough for collision resistance in normal use

## Delete and expiry model

Every persistent record must include:

- `createdAt`
- `expiresAt`
- delete-token hash
- active / expired / deleted status

The default expiry is 30 days unless a future release intentionally changes the policy and updates the gate evidence.

The delete-token hash must be stored instead of the raw delete token.

## Read behavior expectations

A future persistent public route must render:

- active DTO state
- expired state
- deleted state
- not-found state

It must never reveal raw choices or private score internals in any of those states.

## Explicitly blocked in Phase 6.0

- no backend implementation in Phase 6.0
- no database implementation in Phase 6.0
- no public persistent result route yet
- no API route
- no authentication
- no payment
- no AI generation
- no analytics
- no raw-choice persistence
- no full result serialization persistence

## Exit criteria

Phase 6.0 passes only if:

- Phase 5 preview closure still passes
- PublicResultDto contract still passes
- `PublicResultStorageAdapter` exists
- storage accepts minimized PublicResultDto only
- anonymous non-sequential result id policy is defined
- delete-token hash and default expiry are defined
- no backend/database/auth/payment/AI implementation exists
