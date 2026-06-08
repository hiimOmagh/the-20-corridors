# Update Manifest — Phase 10.2 Hosted Public Result Page Evidence

## Package

`the-20-corridors_phase10_2_hosted_public_result_page_evidence.zip`

## Scope

Phase 10.2 adds an opt-in hosted public-result page evidence gate. It verifies the deployed `/r/[publicId]` page surface through GET-only hosted evidence without wiring the hosted gate into local `npm run validate`.

## Changed files

```text
README.md
package.json
docs/dev/update-manifest.md
docs/release/phase-10-2-hosted-public-result-page-evidence.md
docs/ui/phase-10-2-hosted-public-result-page-evidence-status.md
docs/ui/phase-10-transition-plan.md
scripts/phase10-hosted-public-result-page-evidence.ts
src/core/release/phase10HostedPublicResultPageEvidence.ts
src/features/results/hostedPublicResultPageEvidence.ts
tests/core/phase10HostedPublicResultPageEvidence.test.ts
tests/ui/hostedPublicResultPageEvidence.test.ts
```

## Generated after hosted run

```text
docs/evidence/phase10-hosted-public-result-page-evidence-latest.json
```

## Required hosted evidence environment

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

## Validation

Local validation before hosted run:

```text
npm run typecheck
npm test -- phase10HostedPublicResultPageEvidence
npm test -- hostedPublicResultPageEvidence
npm run validate
npm audit --omit=dev
npm audit
npm run build
```

Hosted evidence run after deployment:

```text
npm run evidence:hosted-public-result-page
```

## Scope explicitly not included

```text
local validate dependency on external hosted deployment
production mutation smoke
POST/PUT/PATCH/DELETE hosted checks
runtime UX behavior changes
public-result route mutation changes
persistence changes
database binding changes
account system
payment path
analytics or telemetry
generated-AI behavior
Playwright dependency expansion
```
