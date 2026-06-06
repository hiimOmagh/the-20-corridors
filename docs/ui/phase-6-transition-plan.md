# Phase 6 Transition Plan — Persistent Public Result Links

## Entry condition

Do not start Phase 6 until Phase 5.4 closure passes.

## Strategic goal

Phase 6 may introduce persistent public result links, but only after the DTO/privacy contract has been locked and proven locally.

## Required boundaries

- Persist only minimized `PublicResultDto` payloads.
- Never persist raw answers.
- Never expose private tag scores, private axis scores, evidence digest internals, or full engine result serialization.
- Public result IDs must be anonymous, non-sequential, and non-guessable.
- Public links must support expiry and deletion strategy before broad sharing.
- Public routes must be read-only unless an explicit delete-token flow is implemented.

## Recommended Phase 6 order

1. Define storage contract and deletion/expiry semantics.
2. Add backend/read-only storage readiness gate.
3. Add local adapter interface with in-memory implementation first.
4. Add persistent public route behind tests.
5. Add delete-token handling.
6. Add public-link smoke gate.

## Still blocked until explicitly opened

- Authentication
- Payment
- AI report generation
- Analytics tracking
- Full-result export
