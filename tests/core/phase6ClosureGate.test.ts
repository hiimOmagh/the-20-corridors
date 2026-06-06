import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runPhase6ClosureGate } from '../../src/core/release/phase6ClosureGate';

const report = await runPhase6ClosureGate();

describe('Phase 6 public-link lifecycle closure gate', () => {
  it('passes the formal Phase 6 closure gate', () => {
    expect(report.gates).toMatchObject({
      publicStorageContractPassed: true,
      inMemoryAdapterContractPassed: true,
      localPersistentFlowContractPassed: true,
      lifecycleUiContractPassed: true,
      closureScriptExists: true,
      validateScriptRunsPhase6ClosureGate: true,
      validateScriptRunsPublicStorageContract: true,
      validateScriptRunsInMemoryAdapterContract: true,
      validateScriptRunsLocalFlowContract: true,
      validateScriptRunsLifecycleUiContract: true,
      phase6ClosureReviewDocExists: true,
      phase7TransitionDocExists: true,
      noBackendApiDatabaseAuthPaymentAiAnalyticsScope: true,
      noPersistentPublicLookupRoute: true,
      noNetworkPersistenceSignalsInLifecycleScope: true,
      dtoOnlyLifecyclePreserved: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records closure metadata, scripts, and coverage', () => {
    expect(report.schemaVersion).toBe('phase-6.4-public-link-lifecycle-closure-gate-v1');
    expect(report.scripts.publicStorageContract).toBe('tsx scripts/public-result-storage-contract.ts');
    expect(report.scripts.inMemoryAdapterContract).toBe('tsx scripts/in-memory-public-result-storage-contract.ts');
    expect(report.scripts.localFlowContract).toBe('tsx scripts/local-persistent-link-flow-contract.ts');
    expect(report.scripts.lifecycleUiContract).toBe('tsx scripts/public-link-lifecycle-ui-contract.ts');
    expect(report.scripts.closurePhase6).toBe('tsx scripts/phase6-closure-gate.ts');
    expect(report.scripts.validate).toContain('npm run closure:phase6');
    expect(report.coverage).toMatchObject({
      publicStorageIssueCount: 0,
      inMemoryIssueCount: 0,
      localFlowIssueCount: 0,
      lifecycleUiIssueCount: 0,
      lifecycleCheckedFileCount: 10,
      blockedPathCount: 0,
      persistentRouteCount: 0,
      blockedSignalCount: 0,
      networkPersistenceSignalCount: 0,
      rawPrivateSignalCount: 0
    });
  });

  it('locks the closure review and Phase 7 transition documents', () => {
    expect(report.docs.phase6ClosureReview).toBe('docs/release/phase-6-closure-review.md');
    expect(report.docs.phase7Transition).toBe('docs/ui/phase-7-transition-plan.md');
    expect(report.files.lifecycleUiHelper).toBe('src/features/results/publicLinkLifecycleUi.ts');
    expect(report.files.resultsClient).toBe('src/features/results/ResultsClient.tsx');
  });

  it('detects missing Phase 6 closure script wiring', async () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = await runPhase6ClosureGate({ repoRoot: tempRoot });

    expect(tempReport.gates.closureScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('missing_closure_phase6_script');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-phase6-closure-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
