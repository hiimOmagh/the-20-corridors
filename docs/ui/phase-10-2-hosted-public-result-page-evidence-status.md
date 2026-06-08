# Phase 10.2 Hosted Public Result Page Evidence Status

## Current state

Phase 10.2 introduces an opt-in hosted public-result evidence gate.

The gate is intentionally not part of `npm run validate`, because it depends on a live deployment and hosted public result URLs.

## Required proof

```text
hosted renderable result URL configured
hosted not-found URL configured
hosted renderable page passes
hosted not-found page passes
configured unavailable states are non-actionable
public URLs avoid raw answers
hosted HTML avoids raw answers
visible hosted text avoids raw answers
hosted HTML and visible text avoid raw delete tokens
hosted accessibility frame exists
hosted checks are GET-only
local validate excludes hosted gate
```

## Operator notes

Run the hosted gate only after the commit is deployed and the renderable public-result URL exists.

If deleted, expired, or disabled public-result URLs are not available yet, leave their environment variables unset. The gate records those states as explicitly deferred rather than silently pretending they were verified.

## Evidence output

```text
docs/evidence/phase10-hosted-public-result-page-evidence-latest.json
```
