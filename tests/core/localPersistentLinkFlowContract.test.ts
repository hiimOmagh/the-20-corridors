import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runLocalPersistentLinkFlowContract } from '../../src/core/release/localPersistentLinkFlowContract';

const report = await runLocalPersistentLinkFlowContract();

describe('local persistent-link flow contract', () => {
  it('passes the Phase 6.2 local flow contract gate', () => {
    expect(report.gates).toMatchObject({
      inMemoryAdapterContractPassed: true,
      flowHelperExists: true,
      flowScriptExists: true,
      validateScriptRunsFlowContract: true,
      contractDocExists: true,
      phase62StatusDocExists: true,
      createReadDeleteLifecyclePassed: true,
      wrongDeleteTokenRejected: true,
      pruneDeletedRecordPassed: true,
      dtoOnlyStoragePreserved: true,
      deleteTokenBehaviorPassed: true,
      previewRouteIsLocalOnlyStub: true,
      noRouteApiDatabaseOrPersistentLookup: true,
      noAuthPaymentAiAnalytics: true,
      noRawChoiceOrPrivateScoreLeakage: true,
      noBrowserPersistenceOrNetworkSignals: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records lifecycle and script evidence', () => {
    expect(report.schemaVersion).toBe('phase-6.2-local-persistent-link-flow-stub-v1');
    expect(report.scripts.localFlowContract).toBe('tsx scripts/local-persistent-link-flow-contract.ts');
    expect(report.scripts.validate).toContain('npm run flow:public-link-memory');
    expect(report.lifecycle).toMatchObject({
      phase: 'phase-6.2-local-persistent-link-flow-stub',
      previewRoute: '/r/preview',
      createdStatus: 'active',
      readAfterCreateStatus: 'active',
      wrongDeleteStatus: 'active',
      deleteStatus: 'deleted',
      readAfterDeleteStatus: 'deleted',
      prunedDeletedCount: 1,
      rawAnswerLeakageCount: 0,
      fullResultLeakageCount: 0
    });
  });

  it('keeps the flow helper local-only and DTO-only', () => {
    expect(report.implementationScan.blockedPaths).toEqual([]);
    expect(report.implementationScan.persistentRouteFiles).toEqual([]);
    expect(report.implementationScan.blockedSignals).toEqual([]);
    expect(report.implementationScan.rawOrPrivateSignals).toEqual([]);
    expect(report.implementationScan.browserPersistenceOrNetworkSignals).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });

  it('detects missing flow script wiring', async () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = await runLocalPersistentLinkFlowContract({ repoRoot: tempRoot });

    expect(tempReport.gates.flowScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('local_persistent_link_flow_contract_failed:flowScriptExists');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-local-flow-contract-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
