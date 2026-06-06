import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runBackendHandlerDryRunContract } from '../../src/core/release/backendHandlerDryRunContract';

const report = await runBackendHandlerDryRunContract();

describe('backend handler dry-run contract', () => {
  it('passes the Phase 7.2 backend handler dry-run gates', () => {
    expect(report.gates).toMatchObject({
      backendRouteSkeletonGuardPassed: true,
      dryRunScriptExists: true,
      validateScriptRunsDryRunContract: true,
      dryRunModuleExists: true,
      dryRunContractDocExists: true,
      phase72StatusDocExists: true,
      handlerBoundariesDefined: true,
      createReadDeleteDryRunFlowPassed: true,
      invalidDeleteTokenHandled: true,
      expiredReadHidesDto: true,
      deletedReadHidesDto: true,
      dtoOnlyResponsesPreserved: true,
      payloadSizeWithinLimit: true,
      noNextRouteFilesYet: true,
      noRequestObjectOrNextResponseDependency: true,
      noDatabaseAuthPaymentAiAnalyticsImplementation: true,
      noRawAnswerOrFullResultTransport: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records dry-run flow coverage without creating route files', () => {
    expect(report.schemaVersion).toBe('phase-7.2-backend-handler-dry-run-contract-v1');
    expect(report.scripts.dryRunContract).toBe('tsx scripts/backend-handler-dry-run-contract.ts');
    expect(report.scripts.validate).toContain('npm run dryrun:backend-handlers');
    expect(report.dryRun).toMatchObject({
      mode: 'handler-logic-only-no-next-route-files',
      createStatus: 'created',
      readStatus: 'active',
      wrongDeleteStatus: 'invalid-delete-token',
      deleteStatus: 'deleted',
      readAfterDeleteStatus: 'deleted',
      expiredReadStatus: 'expired'
    });
    expect(report.coverage).toMatchObject({
      routeSkeletonIssueCount: 0,
      actualRouteFileCount: 0,
      handlerBoundaryCount: 8,
      dryRunMethodCount: 3
    });
  });

  it('keeps implementation scope blocked in this phase', () => {
    expect(report.implementationScan.actualRouteFiles).toEqual([]);
    expect(report.implementationScan.requestObjectOrNextResponseSignals).toEqual([]);
    expect(report.implementationScan.blockedImplementationSignals).toEqual([]);
    expect(report.implementationScan.rawOrFullResultSignals).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });

  it('detects premature route file creation', async () => {
    const tempRoot = makeMinimalTempRepoRoot();
    mkdirSync(path.join(tempRoot, 'src/app/api/public-results'), { recursive: true });
    writeFileSync(path.join(tempRoot, 'src/app/api/public-results/route.ts'), 'export async function POST() {}');

    const tempReport = await runBackendHandlerDryRunContract({ repoRoot: tempRoot });
    expect(tempReport.gates.noNextRouteFilesYet).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('next_api_route_files_created_too_early');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase7-handler-dry-run-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(
    path.join(tempRoot, 'package.json'),
    JSON.stringify({ scripts: { 'dryrun:backend-handlers': 'tsx scripts/backend-handler-dry-run-contract.ts', validate: 'npm run dryrun:backend-handlers' } }, null, 2)
  );
  return tempRoot;
}
