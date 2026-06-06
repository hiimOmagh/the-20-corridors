import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runInMemoryPublicResultStorageContract } from '../../src/core/release/inMemoryPublicResultStorageContract';

const report = await runInMemoryPublicResultStorageContract();

describe('in-memory public result storage adapter contract', () => {
  it('passes the Phase 6.1 adapter contract gate', () => {
    expect(report.gates).toMatchObject({
      publicStorageContractPassed: true,
      adapterFileExists: true,
      adapterContractScriptExists: true,
      validateScriptRunsAdapterContract: true,
      contractDocExists: true,
      phase61StatusDocExists: true,
      createReadDeletePruneFlowPassed: true,
      duplicateIdGuardPassed: true,
      dtoOnlyRecordsPreserved: true,
      inMemoryDiagnosticsPassed: true,
      noBackendApiDatabaseAuthPaymentAiImplementation: true,
      noRawChoiceOrPrivateScoreLeakage: true,
      noPersistentPublicRouteYet: true,
      noExternalNetworkOrBrowserPersistenceSignals: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records adapter flow and script evidence', () => {
    expect(report.schemaVersion).toBe('phase-6.1-in-memory-public-result-storage-adapter-v1');
    expect(report.scripts.inMemoryAdapterContract).toBe('tsx scripts/in-memory-public-result-storage-contract.ts');
    expect(report.scripts.validate).toContain('npm run adapter:public-storage-memory');
    expect(report.adapterFlow).toMatchObject({
      createdStatus: 'active',
      readStatus: 'active',
      wrongDeleteStatus: 'active',
      deletedStatus: 'deleted',
      prunedDeletedCount: 1,
      duplicateRejected: true,
      diagnosticsRecordCountBeforePrune: 1,
      diagnosticsRecordCountAfterPrune: 0
    });
  });

  it('keeps implementation scope local-only and memory-only', () => {
    expect(report.implementationScan.blockedPaths).toEqual([]);
    expect(report.implementationScan.persistentRouteFiles).toEqual([]);
    expect(report.implementationScan.blockedSignals).toEqual([]);
    expect(report.implementationScan.rawOrPrivateSignals).toEqual([]);
    expect(report.implementationScan.externalNetworkOrBrowserPersistenceSignals).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });

  it('detects missing adapter script wiring', async () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = await runInMemoryPublicResultStorageContract({ repoRoot: tempRoot });

    expect(tempReport.gates.adapterContractScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('in_memory_public_storage_contract_failed:adapterContractScriptExists');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-in-memory-public-storage-contract-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
