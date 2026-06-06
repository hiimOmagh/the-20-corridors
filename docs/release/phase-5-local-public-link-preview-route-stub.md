# Phase 5.2 — Local Public-Link Preview Route Stub Contract

Phase 5.2 introduces a route stub for `/r/preview`. The route is intentionally local-only and does not implement public result persistence.

## Contract

The preview route must:

1. read only the current browser session result;
2. convert the public engine result into a minimized `PublicResultDto`;
3. render only public-safe fields;
4. exclude individual choices and private score internals;
5. avoid backend, API, database, auth, payment, analytics, AI, and public result lookup;
6. remain compatible with future public-link rendering;
7. expose clear boundary copy explaining that it is a local preview.

## Allowed public preview fields

- schema version
- result id
- created/expiry timestamps
- archetype summary
- confidence band
- dominant trait labels
- deep motive summary
- axis summaries
- contradiction summaries
- share-card summary
- report overview summary
- delete-token hash placeholder for future backend design

## Blocked fields

The preview route must not render raw choices, selected options, question identifiers, answer text, evidence digest, tag scores, raw axis scores, private report seed, serialized full result envelopes, or device/user identifiers.
