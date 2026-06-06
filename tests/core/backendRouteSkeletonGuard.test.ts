import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runBackendRouteSkeletonGuard } from '../../src/core/release/backendRouteSkeletonGuard';

const report = await runBackendRouteSkeletonGuard();

describe('backend route skeleton guard', () => {
  it('passes the Phase 7.1 backend route skeleton gates', () => {
    expect(report.gates).toMatchObject({
      backendApiBoundaryPassed: true,
      routeSkeletonGuardScriptExists: true,
      validateScriptRunsRouteSkeletonGuard: true,
      routeSkeletonModuleExists: true,
      routeSkeletonDocExists: true,
      phase71StatusDocExists: true,
      plannedRouteFilesDefined: true,
      plannedMethodsMatchApiContract: true,
      requestHandlingBoundaryDefined: true,
      futureGuardExpectationsDefined: true,
      noActualRouteFilesYet: true,
      noRequestHandlersYet: true,
      noBackendApiDatabaseAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRoute: true,
      noRawAnswerOrFullResultTransport: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records planned route skeleton coverage without creating route files', () => {
    expect(report.schemaVersion).toBe('phase-7.1-backend-route-skeleton-guard-v1');
    expect(report.scripts.routeSkeletonGuard).toBe('tsx scripts/backend-route-skeleton-guard.ts');
    expect(report.scripts.validate).toContain('npm run guard:backend-routes');
    expect(report.routeSkeleton.plannedRouteFiles).toEqual([
      'src/app/api/public-results/route.ts',
      'src/app/api/public-results/[publicId]/route.ts'
    ]);
    expect(report.routeSkeleton.plannedMethods).toEqual(['POST', 'GET', 'DELETE']);
    expect(report.coverage).toMatchObject({
      backendApiBoundaryIssueCount: 0,
      plannedRouteFileCount: 2,
      plannedMethodCount: 3,
      actualRouteFileCount: 0
    });
  });

  it('keeps route implementation blocked in this phase', () => {
    expect(report.implementationScan.actualRouteFiles).toEqual([]);
    expect(report.implementationScan.requestHandlerSignals).toEqual([]);
    expect(report.implementationScan.blockedScopePaths).toEqual([]);
    expect(report.implementationScan.blockedImplementationSignals).toEqual([]);
    expect(report.implementationScan.persistentRouteFiles).toEqual([]);
    expect(report.implementationScan.rawOrFullResultSignals).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });

  it('detects premature route file creation', async () => {
    const tempRoot = makeMinimalTempRepoRoot();
    mkdirSync(path.join(tempRoot, 'src/app/api/public-results'), { recursive: true });
    writeFileSync(path.join(tempRoot, 'src/app/api/public-results/route.ts'), 'export async function POST() {}');

    const tempReport = await runBackendRouteSkeletonGuard({ repoRoot: tempRoot });
    expect(tempReport.gates.noActualRouteFilesYet).toBe(false);
    expect(tempReport.gates.noRequestHandlersYet).toBe(false);
    expect(tempReport.issues).toContain('actual_route_files_created_too_early');
    expect(tempReport.issues).toContain('request_handlers_created_too_early');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase7-route-skeleton-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(
    path.join(tempRoot, 'package.json'),
    JSON.stringify({ scripts: { 'guard:backend-routes': 'tsx scripts/backend-route-skeleton-guard.ts', validate: 'npm run guard:backend-routes' } }, null, 2)
  );
  return tempRoot;
}
