import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runPhase7ClosureGate } from '../../src/core/release/phase7ClosureGate';

const report = await runPhase7ClosureGate();

describe('Phase 7 backend route closure gate', () => {
  it('passes the formal Phase 7 closure gate', () => {
    expect(report.gates).toMatchObject({
      backendApiBoundaryPassed: true,
      backendRouteSkeletonPassed: true,
      backendHandlerDryRunPassed: true,
      backendRouteHandlersPassed: true,
      backendRouteRuntimeSmokePassed: true,
      closureScriptExists: true,
      validateScriptRunsPhase7ClosureGate: true,
      validateScriptRunsBackendApiBoundary: true,
      validateScriptRunsBackendRouteSkeleton: true,
      validateScriptRunsBackendDryRun: true,
      validateScriptRunsBackendRouteHandlers: true,
      validateScriptRunsBackendRuntimeSmoke: true,
      phase7ClosureReviewDocExists: true,
      phase7ClosureCriteriaDocExists: true,
      phase8TransitionDocExists: true,
      approvedApiRouteSurfacePreserved: true,
      dtoOnlyRuntimeTransportPreserved: true,
      noRawAnswerOrFullResultTransport: true,
      noDatabaseAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRoute: true,
      routeResponseStatusMappingPreserved: true,
      deleteTokenTransportPreserved: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records closure metadata, scripts, and coverage', () => {
    expect(report.schemaVersion).toBe('phase-7.5-backend-route-closure-gate-v1');
    expect(report.scripts.backendApiBoundary).toBe('tsx scripts/backend-api-boundary-contract.ts');
    expect(report.scripts.backendRouteSkeleton).toBe('tsx scripts/backend-route-skeleton-guard.ts');
    expect(report.scripts.backendDryRun).toBe('tsx scripts/backend-handler-dry-run-contract.ts');
    expect(report.scripts.backendRouteHandlers).toBe('tsx scripts/backend-route-handlers-contract.ts');
    expect(report.scripts.backendRuntimeSmoke).toBe('tsx scripts/backend-route-runtime-smoke-contract.ts');
    expect(report.scripts.closurePhase7).toBe('tsx scripts/phase7-closure-gate.ts');
    expect(report.scripts.validate).toContain('npm run closure:phase7');
    expect(report.coverage).toMatchObject({
      backendApiBoundaryIssueCount: 0,
      backendRouteSkeletonIssueCount: 0,
      backendHandlerDryRunIssueCount: 0,
      backendRouteHandlersIssueCount: 0,
      backendRuntimeSmokeIssueCount: 0,
      checkedFileCount: 15,
      apiRouteFileCount: 2,
      blockedPathCount: 0,
      persistentPublicLookupRouteCount: 0,
      blockedSignalCount: 0,
      rawOrFullResultSignalCount: 0
    });
  });

  it('locks the closure review and Phase 8 transition documents', () => {
    expect(report.docs.phase7ClosureReview).toBe('docs/release/phase-7-closure-review.md');
    expect(report.docs.phase7ClosureCriteria).toBe('docs/release/phase-7-closure-criteria.md');
    expect(report.docs.phase8Transition).toBe('docs/ui/phase-8-transition-plan.md');
    expect(report.files.collectionRoute).toBe('src/app/api/public-results/route.ts');
    expect(report.files.itemRoute).toBe('src/app/api/public-results/[publicId]/route.ts');
  });

  it('detects missing Phase 7 closure script wiring', async () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = await runPhase7ClosureGate({ repoRoot: tempRoot });

    expect(tempReport.gates.closureScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('missing_closure_phase7_script');

    rmSync(tempRoot, { recursive: true, force: true });
  }, 20000);
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase7-closure-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
