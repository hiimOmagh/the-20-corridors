import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  runDatabaseClientQueryReadinessGuard,
  writeDatabaseClientQueryReadinessGuardEvidence
} from '../../src/core/release/databaseClientQueryReadinessGuard';

const report = await runDatabaseClientQueryReadinessGuard();

describe('database client query readiness guard', () => {
  it('passes the Phase 8.7 database client query readiness gate', () => {
    expect(report.gates).toMatchObject({
      databaseClientSmokePassed: true,
      databaseQueryContractPassed: true,
      readinessScriptExists: true,
      validateScriptRunsQueryReadiness: true,
      readinessModuleExists: true,
      readinessGuardModuleExists: true,
      readinessDocExists: true,
      phase87StatusDocExists: true,
      parameterizedQueryHelpersDefined: true,
      allQueryIntentsMapped: true,
      placeholderValueAlignmentPassed: true,
      noRawStringInterpolationForUserValues: true,
      queryHelpersServerOnly: true,
      noSqlExecutionInReadinessGuard: true,
      noNetworkQueryExecution: true,
      noMutationSmokeAgainstDatabase: true,
      selectedSdkImportStillConfinedToSmokeBoundary: true,
      noDatabaseBackedAdapterYet: true,
      factoryStillRefusesRouteBoundDatabaseAdapter: true,
      routesRemainMemoryDryRun: true,
      noAuthPaymentAiAnalyticsTelemetryImplementation: true,
      noPersistentPublicLookupRoute: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records readiness coverage and implementation boundaries', () => {
    expect(report.readiness).toMatchObject({
      selectedSdkName: '@neondatabase/serverless',
      tableName: 'public_result_links',
      sqlExecutionAllowed: false,
      networkSmokeAllowed: false,
      mutationSmokeAllowed: false,
      routeBindingAllowed: false,
      adapterPersistenceAllowed: false
    });
    expect(report.coverage).toMatchObject({
      databaseClientSmokeIssueCount: 0,
      databaseQueryIssueCount: 0,
      checkedFileCount: 8,
      implementationFileCount: 3,
      queryDescriptorCount: 6,
      mappedIntentCount: 6,
      placeholderMismatchCount: 0,
      importedDatabaseSdkFileCount: 1,
      unapprovedDatabaseSdkImportFileCount: 0,
      executionSignalCount: 0,
      networkExecutionSignalCount: 0,
      rawInterpolationSignalCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0
    });
  });

  it('writes query readiness evidence to disk', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase87-query-readiness-'));
    try {
      const outputPath = path.join(tempDir, 'docs/evidence/database-client-query-readiness-guard-latest.json');
      writeDatabaseClientQueryReadinessGuardEvidence(report, outputPath);
      expect(existsSync(outputPath)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('detects missing query readiness script wiring', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase87-query-readiness-missing-script-'));
    try {
      writeMinimalRepo(tempDir, { validateScript: 'npm run typecheck' });
      const tempReport = await runDatabaseClientQueryReadinessGuard({ repoRoot: tempDir });
      expect(tempReport.gates.validateScriptRunsQueryReadiness).toBe(false);
      expect(tempReport.issues).toContain('database_client_query_readiness_failed:validateScriptRunsQueryReadiness');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

function writeMinimalRepo(tempDir: string, options: { readonly validateScript: string }): void {
  writeJson(path.join(tempDir, 'package.json'), {
    scripts: {
      validate: options.validateScript,
      'smoke:database-client': 'tsx scripts/database-client-smoke-boundary.ts',
      'contract:database-query': 'tsx scripts/database-query-contract.ts',
      'guard:database-query-readiness': 'tsx scripts/database-client-query-readiness-guard.ts'
    }
  });

  writeJson(path.join(tempDir, 'docs/evidence/database-client-smoke-boundary-latest.json'), {
    gates: { overallPassed: true },
    issues: []
  });
  writeJson(path.join(tempDir, 'docs/evidence/database-query-contract-latest.json'), {
    gates: { overallPassed: true },
    issues: []
  });

  writeText(path.join(tempDir, 'scripts/database-client-query-readiness-guard.ts'), 'phase-8.7-script');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseClientQueryReadiness.ts'), 'Routes still use memory/dry-run behavior');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseClientSmokeBoundary.ts'), "from '@neondatabase/serverless'");
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseQueryContract.ts'), 'public_result_links');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultStorageAdapterFactory.ts'), 'databaseAdapterCreated: false routeBindingAllowed: false');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultRouteHandlers.ts'), 'handlePublicResultCreateDryRun');
  writeText(
    path.join(tempDir, 'docs/release/phase-8-database-client-query-readiness-guard.md'),
    [
      'Phase 8.7 Database Client Query Readiness Guard',
      'Parameterized query helpers are defined',
      'No raw string interpolation for user-controlled values',
      'Insert/read/delete/expiry query helpers map to Phase 8.5 intents',
      'Query helpers are server-only',
      'No route binding yet',
      'No adapter persistence yet',
      'No mutation smoke against production DB'
    ].join('\n')
  );
  writeText(path.join(tempDir, 'docs/ui/phase-8-7-database-client-query-readiness-guard-status.md'), 'Phase 8.7 Database Client Query Readiness Guard');
  writeText(path.join(tempDir, 'docs/ui/phase-8-transition-plan.md'), 'Phase 8.7 Database Client Query Readiness Guard');
  writeText(path.join(tempDir, 'src/core/release/databaseClientQueryReadinessGuard.ts'), 'guard');
}

function writeText(filePath: string, contents: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
