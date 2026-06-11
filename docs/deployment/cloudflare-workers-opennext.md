# Cloudflare Workers OpenNext deployment

## Purpose

This package adds the minimum Cloudflare Workers/OpenNext configuration required to deploy the dynamic Next.js routes used by The 20 Corridors.

The previous Cloudflare build failed because `npx @opennextjs/cloudflare build` could not find `open-next.config.ts` in the project root.

## Added deployment surface

- `open-next.config.ts` defines the OpenNext Cloudflare adapter configuration.
- `wrangler.jsonc` points Wrangler to `.open-next/worker.js` and `.open-next/assets`.
- `package.json` adds Cloudflare/OpenNext scripts and development dependencies.
- `package-lock.json` locks the Cloudflare/OpenNext dependency graph for CI/build reproducibility.

## Cloudflare build settings

Use a Workers/OpenNext deployment, not the deprecated `@cloudflare/next-on-pages` flow.

Recommended Cloudflare settings:

```text
Build command: npm run cf:build
Deploy command: npx wrangler deploy
```

The build log must show OpenNext and must not show:

```text
npx @cloudflare/next-on-pages@1
```

## Local validation

```powershell
Remove-Item -Force .\docs\evidence\phase10-hosted-public-result-page-evidence-latest.json -ErrorAction SilentlyContinue
git restore -- docs/evidence
Remove-Item -Recurse -Force .next, .open-next, .vercel, .turbo, coverage, dist, out, playwright-report, test-results -ErrorAction SilentlyContinue

npm install
npm run typecheck
npm test -- phase10HostedPublicResultPageEvidence
npm test -- hostedPublicResultPageEvidence
npm run validate
npm audit --omit=dev
npm audit
npm run build
npm run cf:build

Remove-Item -Recurse -Force .next, .open-next, .vercel -ErrorAction SilentlyContinue
git status --short
```

## Phase 10.2 lock condition

This package only fixes deployment configuration. Phase 10.2 is locked only after a real hosted `/r/<publicId>` URL passes:

```powershell
$env:PHASE10_2_HOSTED_RENDERABLE_PUBLIC_RESULT_URL="https://YOUR-WORKER-HOST/r/YOUR-PUBLIC-ID"
$env:PHASE10_2_HOSTED_NOT_FOUND_PUBLIC_RESULT_URL="https://YOUR-WORKER-HOST/r/phase10-2-missing-public-result-id"

npm run evidence:hosted-public-result-page
```

Commit the generated hosted evidence only if the script prints:

```text
Phase 10.2 hosted public result page evidence gate passed.
```
