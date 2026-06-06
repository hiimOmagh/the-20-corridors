import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runBackendRouteSkeletonGuard } from '../../src/core/release/backendRouteSkeletonGuard';

const report = await runBackendRouteSkeletonGuard();

describe('backend route skeleton guard', () => {
  it('passes the Phase 7.3 approved backend route skeleton gates', () => {
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
      approvedRouteFilesPresent: true,
      onlyApprovedRouteFilesPresent: true,
      onlyApprovedRequestHandlersPresent: true,
      routeFilesUseDryRunHandlersOnly: true,
      noBackendApiDatabaseAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRoute: true,
      noRawAnswerOrFullResultTransport: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records approved route skeleton coverage with dry-run route files', () => {
    expect(report.schemaVersion).toBe('phase-7.3-backend-route-skeleton-guard-v2');
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
      actualRouteFileCount: 2
    });
  });

  it('keeps route implementation constrained to approved dry-run handlers', () => {
    expect(report.implementationScan.actualRouteFiles).toEqual([
      'src/app/api/public-results/route.ts',
      'src/app/api/public-results/[publicId]/route.ts'
    ]);
    expect(report.implementationScan.unapprovedRouteFiles).toEqual([]);
    expect(report.implementationScan.requestHandlerSignals).toEqual([
      'export async function POST',
      'export async function GET',
      'export async function DELETE'
    ]);
    expect(report.implementationScan.blockedScopePaths).toEqual([]);
    expect(report.implementationScan.blockedImplementationSignals).toEqual([]);
    expect(report.implementationScan.persistentRouteFiles).toEqual([]);
    expect(report.implementationScan.rawOrFullResultSignals).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });

  it('detects unapproved public-result route files', async () => {
    const tempRoot = makeMinimalTempRepoRoot();
    mkdirSync(path.join(tempRoot, 'src/app/api/public-results/extra'), { recursive: true });
    writeFileSync(path.join(tempRoot, 'src/app/api/public-results/extra/route.ts'), 'export async function GET() {}');

    const tempReport = await runBackendRouteSkeletonGuard({ repoRoot: tempRoot });
    expect(tempReport.gates.onlyApprovedRouteFilesPresent).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('unapproved_public_result_route_files_detected');

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
