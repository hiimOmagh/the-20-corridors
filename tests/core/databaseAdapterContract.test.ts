import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { runDatabaseAdapterContract } from '../../src/core/release/databaseAdapterContract';

const report = await runDatabaseAdapterContract();

describe('Phase 8.0 database adapter contract', () => {
  it('passes the contract-only database adapter gate', () => {
    expect(report.gates).toMatchObject({
      phase7ClosurePassed: true,
      databaseAdapterScriptExists: true,
      validateScriptRunsDatabaseAdapterContract: true,
      databaseContractModuleExists: true,
      databaseContractDocExists: true,
      phase80StatusDocExists: true,
      adapterContractExtendsPublicResultStorageAdapter: true,
      databaseRecordShapeDefined: true,
      resultIdDeleteHashDateExpiryDeletedAtSchemaFieldsDefined: true,
      minimizedDtoOnlyRecord: true,
      rawDeleteTokenNeverStored: true,
      migrationExpectationsDefinedWithoutMigrationFiles: true,
      serverOnlyAccessBoundaryDefined: true,
      expiredAndDeletedReadBehaviorSpecified: true,
      routeHandlersRemainDryRunInMemory: true,
      noDatabaseClientOrMigrationImplementation: true,
      noAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRoute: true,
      noRawAnswerOrPrivateScoreLeakage: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records scripts, docs, and coverage', () => {
    expect(report.schemaVersion).toBe('phase-8.0-database-adapter-contract-v1');
    expect(report.scripts.databaseAdapterContract).toBe('tsx scripts/database-adapter-contract.ts');
    expect(report.scripts.validate).toContain('npm run contract:database-adapter');
    expect(report.docs.databaseAdapterContract).toBe('docs/release/phase-8-database-adapter-contract.md');
    expect(report.docs.phase80Status).toBe('docs/ui/phase-8-0-database-adapter-contract-status.md');
    expect(report.coverage).toMatchObject({
      phase7IssueCount: 0,
      checkedFileCount: 5,
      allowedRecordKeyCount: 8,
      migrationExpectationCount: 6,
      serverOnlyBoundaryCount: 6,
      readBehaviorRuleCount: 6,
      blockedPathCount: 0,
      blockedSignalCount: 0
    });
  });

  it('locks implementation boundaries', () => {
    expect(report.implementationScan.blockedPaths).toEqual([]);
    expect(report.implementationScan.blockedClientSignals).toEqual([]);
    expect(report.implementationScan.blockedIntegrationSignals).toEqual([]);
    expect(report.implementationScan.persistentLookupRouteFiles).toEqual([]);
    expect(report.implementationScan.rawOrPrivateSignals).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
    expect(report.databaseContract.deletedReadStatus).toBe('deleted');
    expect(report.databaseContract.expiredReadStatus).toBe('expired');
  });

  it('detects missing database adapter script wiring', async () => {
    const tempRoot = makeMinimalTempRepoRoot();
    const tempReport = await runDatabaseAdapterContract({ repoRoot: tempRoot });

    expect(tempReport.gates.databaseAdapterScriptExists).toBe(false);
    expect(tempReport.gates.overallPassed).toBe(false);
    expect(tempReport.issues).toContain('database_adapter_contract_failed:databaseAdapterScriptExists');

    rmSync(tempRoot, { recursive: true, force: true });
  }, 20000);
});

function makeMinimalTempRepoRoot(): string {
  const tempRoot = path.join(os.tmpdir(), `t20-database-adapter-contract-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  mkdirSync(tempRoot, { recursive: true });
  writeFileSync(path.join(tempRoot, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
  return tempRoot;
}
