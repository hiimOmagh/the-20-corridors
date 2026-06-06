# Phase 5.1 — Public Result DTO Builder Contract

## Purpose

Phase 5.1 defines a minimized `PublicResultDto` builder before any public result route, backend storage, database table, authentication layer, payment layer, or AI feature exists.

The builder may derive from the existing public engine result only. It must not use internal scoring modules, raw selected choices, private report seeds, or serialized full-result envelopes.

## Allowed output shape

The public DTO may contain:

- `schemaVersion`
- `resultId`
- `createdAt`
- `expiresAt`
- `archetype`
- `confidenceBand`
- `dominantTags`
- `deepMotive`
- `axisSummaries`
- `contradictionSummaries`
- `shareCard`
- `reportOverview`
- `deleteTokenHash`

## Forbidden output shape

The public DTO must not contain:

- raw answers
- selected answer objects
- question identifiers tied to choices
- answer text
- evidence digest entries
- evidence references that reveal choice paths
- tag scores
- raw axis scores
- private report seed content
- session-storage envelopes
- IP address, email, name, user id, or device fingerprint

## Metadata contract

The builder requires externally supplied metadata:

- anonymous result id
- created timestamp
- expiry timestamp
- delete-token hash

The id must be unguessable in the future implementation and must not be derived from answers. The delete token must not be stored as plaintext once persistence exists.

## Current implementation boundary

Phase 5.1 does not add:

- public route
- API route
- backend
- database
- authentication
- payment
- AI
- public-link persistence

## Acceptance gate

`npm run contract:public-dto` must pass and must verify that:

- Phase 5.0 public-link privacy contract still passes
- the DTO builder exists
- the DTO shape is minimized
- forbidden private fields are absent
- no public route exists yet
- no backend/database/auth/payment/AI implementation exists
- no full-result serialization export is used
