import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  runDatabaseQueryContract,
  writeDatabaseQueryContractEvidence
} from '../../src/core/release/databaseQueryContract';

const report = await runDatabaseQueryContract();

describe('database query contract', () => {
  it('passes the Phase 8.5 database query contract gate', () => {
    expect(report.gates).toMatchObject({
      databaseSdkDecisionPassed: true,
      queryScriptExists: true,
      validateScriptRunsQueryContract: true,
      queryModuleExists: true,
      queryGuardModuleExists: true,
      queryDocExists: true,
      phase85StatusDocExists: true,
      tableContractDefined: true,
      columnsAndTypesDefined: true,
      queryIntentsDefined: true,
      softDeleteBehaviorDefined: true,
      expiredRecordBehaviorDefined: true,
      deleteTokenHashLookupDefined: true,
      noSqlExecutionYet: true,
      noSdkInstallationOrImportYet: true,
      factoryStillCannotCreateDatabaseAdapter: true,
      routesRemainMemoryDryRun: true,
      noDatabaseClientMigrationAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRoute: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records query contract coverage and blocked implementation signals', () => {
    expect(report.queryContract).toMatchObject({
      status: 'query-contract-only-no-sql-execution',
      selectedSdkName: '@neondatabase/serverless',
      tableName: 'public_result_links',
      queryExecutionAllowed: false,
      sqlClientAllowed: false,
      sdkInstallAllowed: false,
      sdkImportAllowed: false,
      routeBindingAllowed: false,
      factoryDatabaseAdapterAllowed: false
    });
    expect(report.coverage).toMatchObject({
      databaseSdkDecisionIssueCount: 0,
      checkedFileCount: 7,
      implementationFileCount: 3,
      columnCount: 9,
      queryIntentCount: 6,
      blockedPathCount: 0,
      installedDatabasePackageCount: 0,
      importedDatabaseSdkSignalCount: 0,
      executableSqlSignalCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0
    });
  });

  it('writes query contract evidence to disk', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase85-query-contract-'));
    try {
      const outputPath = path.join(tempDir, 'docs/evidence/database-query-contract-latest.json');
      writeDatabaseQueryContractEvidence(report, outputPath);
      expect(existsSync(outputPath)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('detects missing query script wiring', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase85-query-missing-script-'));
    try {
      writeMinimalRepo(tempDir, { validateScript: 'npm run typecheck' });
      const tempReport = await runDatabaseQueryContract({ repoRoot: tempDir });
      expect(tempReport.gates.validateScriptRunsQueryContract).toBe(false);
      expect(tempReport.issues).toContain('database_query_contract_failed:validateScriptRunsQueryContract');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

function writeMinimalRepo(tempDir: string, options: { readonly validateScript: string }): void {
  writeJson(path.join(tempDir, 'package.json'), {
    scripts: {
      validate: options.validateScript,
      'contract:database-sdk-decision': 'tsx scripts/database-sdk-selection-decision-record.ts',
      'contract:database-query': 'tsx scripts/database-query-contract.ts'
    },
    dependencies: {},
    devDependencies: {}
  });

  writeJson(path.join(tempDir, 'docs/evidence/database-sdk-selection-decision-record-latest.json'), {
    gates: { overallPassed: true },
    issues: []
  });

  writeText(path.join(tempDir, 'scripts/database-query-contract.ts'), 'phase-8.5-script');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseQueryContract.ts'), 'routes still use memory/dry-run behavior');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseSdkDecision.ts'), 'selected SDK: @neondatabase/serverless');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultStorageAdapterFactory.ts'), 'factory still cannot create database adapter');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultRouteHandlers.ts'), 'handlePublicResultCreateDryRun');
  writeText(
    path.join(tempDir, 'docs/release/phase-8-database-query-contract.md'),
    [
      'Phase 8.5 Database Query Contract',
      'Table contract is defined',
      'Column names and types are defined',
      'Insert/read/delete/update-expiry query intents are defined',
      'Soft-delete behavior is defined',
      'Expired-record behavior is defined',
      'Delete-token-hash lookup behavior is defined',
      'No SQL execution yet',
      'No SDK installation/import yet',
      'Factory still cannot create database adapter',
      'Routes still use memory/dry-run behavior'
    ].join('\n')
  );
  writeText(path.join(tempDir, 'docs/ui/phase-8-5-database-query-contract-status.md'), 'Phase 8.5 Database Query Contract');
  writeText(path.join(tempDir, 'docs/ui/phase-8-transition-plan.md'), 'Phase 8.5 Database Query Contract');
  writeText(path.join(tempDir, 'src/core/release/databaseQueryContract.ts'), 'guard');
}

function writeText(filePath: string, contents: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
