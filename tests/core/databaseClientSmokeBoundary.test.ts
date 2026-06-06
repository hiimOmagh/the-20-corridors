import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  runDatabaseClientSmokeBoundary,
  writeDatabaseClientSmokeBoundaryEvidence
} from '../../src/core/release/databaseClientSmokeBoundary';

const report = await runDatabaseClientSmokeBoundary();

describe('database client smoke boundary', () => {
  it('passes the Phase 8.6 database SDK client smoke gates', () => {
    expect(report.gates).toMatchObject({
      databaseQueryContractPassed: true,
      smokeScriptExists: true,
      validateScriptRunsClientSmoke: true,
      selectedSdkInstalledAndLocked: true,
      selectedSdkImportedOnlyInSmokeBoundary: true,
      clientSmokeModuleExists: true,
      clientSmokeGuardModuleExists: true,
      clientSmokeDocExists: true,
      phase86StatusDocExists: true,
      memoryModeDoesNotCreateClient: true,
      missingEnvFailsClosedBeforeClientCreation: true,
      invalidEnvFailsClosedBeforeClientCreation: true,
      publicEnvFailsClosedBeforeClientCreation: true,
      completeEnvCreatesSmokeClientWithoutNetwork: true,
      nonNetworkSmokeOnly: true,
      noSqlMutationExecution: true,
      noDatabaseBackedAdapterExists: true,
      factoryStillRefusesRouteBoundDatabaseAdapter: true,
      routesRemainMemoryDryRun: true,
      noAuthPaymentAiAnalyticsTelemetryImplementation: true,
      noPersistentPublicLookupRoute: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records installation, import-boundary, and non-network smoke coverage', () => {
    expect(report.smoke).toMatchObject({
      selectedProvider: 'postgresql',
      selectedSdkName: '@neondatabase/serverless',
      boundaryFile: 'src/core/public-link/publicResultDatabaseClientSmokeBoundary.ts',
      defaultStatus: 'memory-mode-no-client-created',
      missingEnvStatus: 'blocked',
      invalidEnvStatus: 'blocked',
      publicEnvStatus: 'blocked',
      completeEnvStatus: 'client-created-smoke-only',
      completeEnvClientCreatedSmokeOnly: true,
      completeEnvNetworkQueryExecuted: false,
      completeEnvSqlMutationExecuted: false,
      completeEnvRouteBindingAllowed: false,
      completeEnvFactoryRouteBindingAllowed: false
    });
    expect(report.smoke.selectedSdkVersionRange).toBe('^1.1.0');
    expect(report.smoke.packageLockVersion).toBe('1.1.0');
    expect(report.implementationScan.installedDatabasePackages).toEqual(['@neondatabase/serverless']);
    expect(report.implementationScan.packageLockDatabasePackages).toEqual(['@neondatabase/serverless']);
    expect(report.implementationScan.importedDatabaseSdkFiles).toEqual([
      'src/core/public-link/publicResultDatabaseClientSmokeBoundary.ts'
    ]);
    expect(report.implementationScan.unapprovedDatabaseSdkImportFiles).toEqual([]);
    expect(report.coverage).toMatchObject({
      databaseQueryIssueCount: 0,
      checkedFileCount: 8,
      implementationFileCount: 3,
      installedDatabasePackageCount: 1,
      packageLockDatabasePackageCount: 1,
      importedDatabaseSdkFileCount: 1,
      unapprovedDatabaseSdkImportFileCount: 0,
      executableSqlSignalCount: 0,
      sqlMutationSignalCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0
    });
  });

  it('writes smoke evidence to disk', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase86-client-smoke-'));
    try {
      const outputPath = path.join(tempDir, 'docs/evidence/database-client-smoke-boundary-latest.json');
      writeDatabaseClientSmokeBoundaryEvidence(report, outputPath);
      expect(existsSync(outputPath)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('detects missing client smoke script wiring', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase86-client-smoke-missing-script-'));
    try {
      writeMinimalRepo(tempDir, { validateScript: 'npm run typecheck' });
      const tempReport = await runDatabaseClientSmokeBoundary({ repoRoot: tempDir });
      expect(tempReport.gates.validateScriptRunsClientSmoke).toBe(false);
      expect(tempReport.issues).toContain('database_client_smoke_boundary_failed:validateScriptRunsClientSmoke');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

function writeMinimalRepo(tempDir: string, options: { readonly validateScript: string }): void {
  writeJson(path.join(tempDir, 'package.json'), {
    scripts: {
      validate: options.validateScript,
      'contract:database-query': 'tsx scripts/database-query-contract.ts',
      'smoke:database-client': 'tsx scripts/database-client-smoke-boundary.ts'
    },
    dependencies: {
      '@neondatabase/serverless': '^1.1.0'
    },
    devDependencies: {}
  });
  writeJson(path.join(tempDir, 'package-lock.json'), {
    packages: {
      'node_modules/@neondatabase/serverless': { version: '1.1.0' }
    }
  });
  writeJson(path.join(tempDir, 'docs/evidence/database-query-contract-latest.json'), { gates: { overallPassed: true }, issues: [] });
  writeText(path.join(tempDir, 'scripts/database-client-smoke-boundary.ts'), 'phase-8.6-script');
  writeText(
    path.join(tempDir, 'src/core/public-link/publicResultDatabaseClientSmokeBoundary.ts'),
    "import { neon } from '@neondatabase/serverless';\nRoutes still use memory/dry-run behavior"
  );
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseQueryContract.ts'), 'query contract');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseSdkDecision.ts'), 'selected SDK: @neondatabase/serverless');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultStorageAdapterFactory.ts'), 'databaseAdapterCreated: false');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultRouteHandlers.ts'), 'handlePublicResultCreateDryRun');
  writeText(
    path.join(tempDir, 'docs/release/phase-8-database-sdk-client-smoke-boundary.md'),
    [
      'Phase 8.6',
      'SDK import exists only in server-only client smoke boundary',
      'Client smoke supports non-network validation first',
      'No SQL mutation is executed',
      'No database-backed adapter exists yet',
      'Factory still refuses route-bound database adapter',
      'Routes still use memory/dry-run behavior'
    ].join('\n')
  );
  writeText(path.join(tempDir, 'docs/ui/phase-8-6-database-sdk-client-smoke-boundary-status.md'), 'Phase 8.6');
  writeText(path.join(tempDir, 'docs/ui/phase-8-transition-plan.md'), 'Phase 8.6');
  writeText(path.join(tempDir, 'src/core/release/databaseClientSmokeBoundary.ts'), 'guard');
}

function writeText(filePath: string, contents: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
