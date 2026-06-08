# Phase 10.2 — Hosted Public Result Page Evidence

## Status

Ready for hosted execution after deployment.

## Intent

Phase 10.2 adds an opt-in hosted evidence gate for deployed public result pages. The gate verifies hosted `/r/[publicId]` behavior through GET-only page checks without changing product runtime behavior or making local validation depend on a live deployment.

## Required hosted inputs

```text
PHASE10_2_HOSTED_RENDERABLE_PUBLIC_RESULT_URL
PHASE10_2_HOSTED_NOT_FOUND_PUBLIC_RESULT_URL
```

Optional unavailable-state URLs:

```text
PHASE10_2_HOSTED_DELETED_PUBLIC_RESULT_URL
PHASE10_2_HOSTED_EXPIRED_PUBLIC_RESULT_URL
PHASE10_2_HOSTED_DISABLED_PUBLIC_RESULT_URL
```

## Evidence covered

```text
renderable hosted public-result page content
hosted not-found/unavailable page copy
optional hosted deleted/expired/disabled states
share/copy renderable-only boundary
raw-answer exclusion in URL, HTML, and visible text
raw delete-token exclusion in HTML and visible text
accessibility frame markers
same-origin hosted URL boundary
GET-only hosted evidence scope
local validate exclusion for hosted gate
```

## Explicit boundaries

```text
No runtime UX changes.
No persistence changes.
No database binding changes.
No production mutation smoke.
No POST/PUT/PATCH/DELETE hosted checks.
No auth, account, payment, analytics, telemetry, or generated-AI behavior.
No Playwright dependency expansion.
```

## Commands

Local verification:

```powershell
npm run typecheck
npm test -- phase10HostedPublicResultPageEvidence
npm test -- hostedPublicResultPageEvidence
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

Hosted execution after deployment:

```powershell
$env:PHASE10_2_HOSTED_RENDERABLE_PUBLIC_RESULT_URL="https://your-host/r/<public-id>"
$env:PHASE10_2_HOSTED_NOT_FOUND_PUBLIC_RESULT_URL="https://your-host/r/phase10-2-missing-public-result-id"
npm run evidence:hosted-public-result-page
```

Generated evidence:

```text
docs/evidence/phase10-hosted-public-result-page-evidence-latest.json
```
