import { existsSync, mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  runDatabaseAdapterActivationDryRunGate,
  writeDatabaseAdapterActivationDryRunGateEvidence
} from '../../src/core/release/databaseAdapterActivationDryRunGate';

const report = await runDatabaseAdapterActivationDryRunGate();

describe('database adapter activation dry-run gate', () => {
  it('passes the Phase 8.9 activation dry-run gate', () => {
    expect(report.gates).toMatchObject({
      adapterImplementationGatePassed: true,
      queryReadinessGuardPassed: true,
      clientSmokeBoundaryPassed: true,
      activationDryRunScriptExists: true,
      validateScriptRunsActivationDryRun: true,
      activationDryRunModuleExists: true,
      activationDryRunGuardModuleExists: true,
      activationDryRunDocExists: true,
      phase89StatusDocExists: true,
      databaseAdapterSelectedInControlledSimulation: true,
      factoryRouteBindingRemainsDisabled: true,
      factoryDatabaseAdapterStillNotCreated: true,
      routesRemainMemoryDryRun: true,
      noProductionMutationSmoke: true,
      noNetworkQueryExecution: true,
      noPersistentPublicLookupRoute: true,
      noAuthPaymentAiAnalyticsTelemetryImplementation: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records dry-run coverage and keeps production binding disabled', () => {
    expect(report.activation).toMatchObject({
      status: 'database-adapter-selected-dry-run',
      requestedFactoryStatus: 'database-factory-contract-only',
      dryRunAdapterCreated: true,
      dryRunExecutorUsed: true,
      factoryDatabaseAdapterCreated: false,
      factoryRouteBindingAllowed: false,
      routeBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      sqlMutationExecuted: false,
      createStatus: 'active',
      readStatus: 'active',
      deleteStatus: 'deleted',
      pruneDeletedCount: 1,
      missingQueryIntents: []
    });
    expect(report.coverage).toMatchObject({
      adapterImplementationIssueCount: 0,
      queryReadinessIssueCount: 0,
      clientSmokeIssueCount: 0,
      checkedFileCount: 8,
      uniqueObservedQueryIntentCount: 6,
      missingQueryIntentCount: 0,
      routeBindingSignalCount: 0,
      factoryBindingSignalCount: 0,
      productionMutationSmokeSignalCount: 0,
      networkExecutionSignalCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0
    });
  });

  it('writes activation dry-run evidence to disk', () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase89-activation-dry-run-'));
    try {
      const outputPath = path.join(tempDir, 'docs/evidence/database-adapter-activation-dry-run-gate-latest.json');
      writeDatabaseAdapterActivationDryRunGateEvidence(report, outputPath);
      expect(existsSync(outputPath)).toBe(true);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('detects missing activation dry-run script wiring', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'phase89-missing-script-'));
    try {
      writeMinimalRepo(tempDir, { validateScript: 'npm run typecheck' });
      const tempReport = await runDatabaseAdapterActivationDryRunGate({ repoRoot: tempDir });
      expect(tempReport.gates.validateScriptRunsActivationDryRun).toBe(false);
      expect(tempReport.issues).toContain('database_adapter_activation_dry_run_gate_failed:validateScriptRunsActivationDryRun');
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
      'guard:database-adapter-implementation': 'tsx scripts/database-adapter-implementation-disabled-factory-gate.ts',
      'dryrun:database-adapter-activation': 'tsx scripts/database-adapter-activation-dry-run-gate.ts'
    }
  });
  writeJson(path.join(tempDir, 'docs/evidence/database-adapter-implementation-disabled-factory-gate-latest.json'), {
    gates: { overallPassed: true },
    issues: []
  });
  writeJson(path.join(tempDir, 'docs/evidence/database-client-query-readiness-guard-latest.json'), {
    gates: { overallPassed: true },
    issues: []
  });
  writeJson(path.join(tempDir, 'docs/evidence/database-client-smoke-boundary-latest.json'), {
    gates: { overallPassed: true },
    issues: []
  });
  writeText(path.join(tempDir, 'scripts/database-adapter-activation-dry-run-gate.ts'), 'phase-8.9-script');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultDatabaseAdapterActivationDryRun.ts'), 'database-adapter-selected-dry-run');
  writeText(path.join(tempDir, 'src/core/release/databaseAdapterActivationDryRunGate.ts'), 'guard');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultRouteHandlers.ts'), 'handlePublicResultCreateDryRun next-route-files-dry-run-in-memory-only');
  writeText(path.join(tempDir, 'src/core/public-link/publicResultStorageAdapterFactory.ts'), 'databaseAdapterCreated: false routeBindingAllowed: false');
  writeText(
    path.join(tempDir, 'docs/release/phase-8-database-adapter-activation-dry-run-gate.md'),
    [
      'Phase 8.9 Database Adapter Activation Dry-Run Gate',
      'Activation dry-run gate exists',
      'Database adapter can be selected in a controlled simulation',
      'Factory route binding remains disabled',
      'Route handlers still use memory/dry-run behavior',
      'No real production mutation smoke'
    ].join('\n')
  );
  writeText(path.join(tempDir, 'docs/ui/phase-8-9-database-adapter-activation-dry-run-gate-status.md'), 'Phase 8.9');
  writeText(path.join(tempDir, 'docs/ui/phase-8-transition-plan.md'), 'Phase 8.9 Route handlers still use memory/dry-run behavior');
}

function writeText(filePath: string, contents: string): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, contents);
}

function writeJson(filePath: string, value: unknown): void {
  writeText(filePath, `${JSON.stringify(value, null, 2)}\n`);
}
