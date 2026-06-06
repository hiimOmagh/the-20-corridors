import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runPublicResultStorageContract } from '../../src/core/release/publicResultStorageContract';

const report = runPublicResultStorageContract();

describe('public result storage contract', () => {
  it('passes the Phase 6.0 storage contract gate', () => {
    expect(report.gates).toMatchObject({
      phase5ClosurePassed: true,
      publicResultDtoContractPassed: true,
      storageContractScriptExists: true,
      validateScriptRunsStorageContract: true,
      storageInterfaceExists: true,
      storageContractDocExists: true,
      phase60StatusDocExists: true,
      adapterInterfaceDefined: true,
      minimizedDtoOnlyStorage: true,
      anonymousNonSequentialIdPolicyDefined: true,
      deleteTokenAndExpiryPolicyDefined: true,
      noBackendApiDatabaseAuthPaymentAiImplementation: true,
      noRawChoiceOrPrivateScoreLeakage: true,
      noPublicPersistentRouteYet: true,
      noStorageImplementationYet: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records scripts, coverage, and policy metadata', () => {
    expect(report.schemaVersion).toBe('phase-6.0-public-result-storage-contract-v1');
    expect(report.scripts.publicStorageContract).toBe('tsx scripts/public-result-storage-contract.ts');
    expect(report.scripts.validate).toContain('npm run contract:public-storage');
    expect(report.storageContract).toMatchObject({
      defaultExpiryDays: 30,
      samplePublicIdSafe: true
    });
    expect(report.coverage).toMatchObject({
      phase5IssueCount: 0,
      dtoIssueCount: 0,
      allowedRecordKeyCount: 7,
      checkedFileCount: 3
    });
  });

  it('keeps implementation scope blocked', () => {
    expect(report.implementationScan.blockedPaths).toEqual([]);
    expect(report.implementationScan.blockedSignals).toEqual([]);
    expect(report.implementationScan.rawOrPrivateSignals).toEqual([]);
    expect(report.implementationScan.persistentRouteFiles).toEqual([]);
    expect(report.implementationScan.storageImplementationSignals).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });

  it('detects missing storage script wiring', () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = runPublicResultStorageContract({ repoRoot: tempRoot });

    expect(tempReport.gates.storageContractScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('public_result_storage_contract_failed:storageContractScriptExists');

    rmSync(tempRoot, { recursive: true, force: true });
  });
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-public-storage-contract-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
