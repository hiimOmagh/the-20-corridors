import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  runDatabaseAdapterImplementationDisabledFactoryGate,
  writeDatabaseAdapterImplementationDisabledFactoryGateEvidence
} from '../../src/core/release/databaseAdapterImplementationDisabledFactoryGate';

const report = await runDatabaseAdapterImplementationDisabledFactoryGate();

describe('database adapter implementation disabled factory gate', () => {
  it('passes the Phase 8.8 adapter implementation gate', () => {
    expect(report.gates).toMatchObject({
      databaseClientQueryReadinessPassed: true,
      databaseClientSmokePassed: true,
      implementationScriptExists: true,
      validateScriptRunsAdapterImplementation: true,
      adapterImplementationModuleExists: true,
      implementationGuardModuleExists: true,
      implementationDocExists: true,
      phase88StatusDocExists: true,
      adapterImplementsDatabaseStorageContract: true,
      adapterMethodsMapToQueryIntents: true,
      allSixQueryIntentsCovered: true,
      sqlExecutionBehindExplicitAdapterMethods: true,
      noProductionMutationSmoke: true,
      factoryStillRefusesDatabaseAdapterBinding: true,
      factoryDoesNotImportDatabaseAdapterImplementation: true,
      routesRemainMemoryDryRun: true,
      noPersistentPublicLookupRoute: true,
      selectedSdkImportStillConfinedToSmokeBoundary: true,
      noAuthPaymentAiAnalyticsTelemetryImplementation: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records implementation coverage and keeps route activation disabled', () => {
    expect(report.adapter).toMatchObject({
      adapterKind: 'server-only-public-result-database-adapter',
      routeBindingAllowed: false,
      factoryBindingAllowed: false,
      productionSmokeAllowed: false,
      createStatus: 'active',
      readStatus: 'active',
      deleteStatus: 'deleted',
      pruneDeletedCount: 1
    });
    expect(report.coverage).toMatchObject({
      databaseClientQueryReadinessIssueCount: 0,
      databaseClientSmokeIssueCount: 0,
      checkedFileCount: 7,
      implementationFileCount: 3,
      expectedQueryIntentCount: 6,
      importedDatabaseSdkFileCount: 1,
      unapprovedDatabaseSdkImportFileCount: 0,
      routeBindingSignalCount: 0,
      factoryImportSignalCount: 0,
      productionMutationSmokeSignalCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0
    });
    expect(new Set(report.adapter.observedQueryIntents)).toEqual(
      new Set([
        'insert-public-result-record',
        'read-active-public-result-by-public-id',
        'verify-delete-token-hash-for-public-id',
        'soft-delete-public-result-by-public-id',
        'mark-expired-public-results',
        'prune-deleted-or-expired-public-results'
      ])
    );
  });

  it('writes adapter implementation evidence to disk', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase88-adapter-implementation-'));
    try {
      const outputPath = path.join(tempDir, 'docs/evidence/database-adapter-implementation-disabled-factory-gate-latest.json');
      writeDatabaseAdapterImplementationDisabledFactoryGateEvidence(report, outputPath);
      expect(existsSync(outputPath)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('detects missing adapter implementation script wiring', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase88-adapter-missing-script-'));
    try {
      writeMinimalRepo(tempDir, { validateScript: 'npm run typecheck' });
      const tempReport = await runDatabaseAdapterImplementationDisabledFactoryGate({ repoRoot: tempDir });
      expect(tempReport.gates.validateScriptRunsAdapterImplementation).toBe(false);
      expect(tempReport.issues).toContain('database_adapter_implementation_gate_failed:validateScriptRunsAdapterImplementation');
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
      'guard:database-query-readiness': 'tsx scripts/database-client-query-readiness-guard.ts',
      'guard:database-adapter-implementation': 'tsx scripts/database-adapter-implementation-disabled-factory-gate.ts'
    }
  });
  writeJson(path.join(tempDir, 'docs/evidence/database-client-query-readiness-guard-latest.json'), {
    gates: { overallPassed: true },
    issues: []
  });
  writeJson(path.join(tempDir, 'docs/evidence/database-client-smoke-boundary-latest.json'), {
    gates: { overallPassed: true },
    issues: []
  });
  writeText(path.join(tempDir, 'scripts/database-adapter-implementation-disabled-factory-gate.ts'), 'phase-8.8-script');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseStorageAdapter.ts'), 'await executeQuery executeQuery(');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseClientQueryReadiness.ts'), 'query readiness');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseClientSmokeBoundary.ts'), "from '@neondatabase/serverless'");
  writeText(path.join(tempDir, 'src/core/public-link/publicResultStorageAdapterFactory.ts'), 'databaseAdapterCreated: false routeBindingAllowed: false');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultRouteHandlers.ts'), 'handlePublicResultCreateDryRun Routes still use memory/dry-run behavior');
  writeText(
    path.join(tempDir, 'docs/release/phase-8-database-adapter-implementation-disabled-factory-gate.md'),
    [
      'Phase 8.8 Database Adapter Implementation Behind Disabled Factory Gate',
      'Database adapter implementation exists',
      'Adapter maps create/read/delete/prune methods to Phase 8.5 query intents',
      'All SQL execution remains behind explicit adapter methods',
      'Factory still refuses database adapter binding by default',
      'Routes still use memory/dry-run behavior',
      'No production mutation smoke yet'
    ].join('\n')
  );
  writeText(path.join(tempDir, 'docs/ui/phase-8-8-database-adapter-implementation-disabled-factory-gate-status.md'), 'Phase 8.8');
  writeText(path.join(tempDir, 'docs/ui/phase-8-transition-plan.md'), 'Phase 8.8 Routes still use memory/dry-run behavior');
  writeText(path.join(tempDir, 'src/core/release/databaseAdapterImplementationDisabledFactoryGate.ts'), 'guard');
}

function writeText(filePath: string, contents: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
