# Phase 5.0 — Public Result Link Privacy Contract

## Status

Phase 5.0 is a **contract-only** package. It defines the privacy model for future public result links without implementing backend, database, auth, payment, AI, analytics, telemetry, or public-link persistence.

## PublicResultDto minimization rule

Future public result links may expose only a minimized `PublicResultDto` derived from the already-rendered deterministic public result summary. The DTO is not allowed to contain raw answer selections, private scoring internals, session envelopes, or identifying data.

Allowed public fields:

```text
resultId
schemaVersion
createdAt
expiresAt
archetype
confidenceBand
dominantTags
deepMotive
axisSummaries
contradictionSummaries
shareCard
reportOverview
deleteTokenHash
```

Forbidden public fields:

```text
answers
rawAnswers
questionAnswers
selectedAnswer
questionId
tagScores
axisScoresRaw
privateReportSeed
sessionStorageEnvelope
ipAddress
email
name
userId
deviceFingerprint
```

## Raw-answer exclusion

**raw answers are never persisted** for public links. A future backend may receive a minimized public DTO only after the local deterministic engine has already produced a public-safe summary. The public-link system must not store `A/B/C/D` answer arrays, question IDs, selected options, tag scores, raw axis scores, or private report seeds.

## Anonymous result id policy

A future public link must use an **anonymous result id** that is:

- unguessable;
- not sequential;
- not derived from answers;
- not derived from archetype, motive, IP address, user agent, or timestamp alone;
- safe to expose in a URL path.

The anonymous result id identifies only the minimized public DTO. It must not be reversible into answer data or user identity.

## Delete and expiry expectations

A future public-link implementation must support:

- a delete token separate from the public result id;
- storing only a hash of the delete token server-side;
- a default expiry for public result links;
- an expired state when the result is beyond its retention window;
- a deleted state when the owner deletes the result;
- no account requirement for basic deletion if the delete token is present.

## Persistence policy

Locked policies:

```text
anonymous-id-only
raw-answers-never-persisted
public-dto-minimized
delete-token-required
default-expiry-required
no-account-required
no-analytics-required
```

## Public-link smoke gate expectations

Before a backend implementation is accepted, a future public-link smoke gate must verify:

```text
public-link-route-loads-by-anonymous-id
public-link-renders-minimized-dto-only
raw-answer-strings-absent-from-public-payload
expired-result-renders-expired-state
deleted-result-renders-deleted-state
delete-token-flow-does-not-reveal-answers
no-auth-required-for-viewing-public-link
```

## Blocked in Phase 5.0

Phase 5.0 explicitly blocks:

- backend API routes;
- database or ORM setup;
- Supabase/Prisma/migration files;
- authentication;
- payment integration;
- AI/LLM generation;
- analytics or telemetry;
- public result persistence;
- public result routes.

No backend implementation in Phase 5.0 is permitted. The exact gate phrase is: no backend implementation in Phase 5.0. The goal is to define privacy and public-link constraints before any public-sharing infrastructure is introduced.

## Acceptance gate

`npm run privacy:public-link` must pass and must verify:

- Phase 4 closure is still valid;
- the public privacy contract exists;
- `PublicResultDto` minimization is defined;
- raw-answer exclusion is defined;
- anonymous result id policy is defined;
- delete token and default expiry expectations are defined;
- future public-link smoke expectations are defined;
- no backend/database/auth/payment/AI implementation exists yet;
- no raw-answer or full-result serialization public-link implementation exists.
