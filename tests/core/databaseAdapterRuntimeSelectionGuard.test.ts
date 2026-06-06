import { describe, expect, it } from 'vitest';
import { runDatabaseAdapterRuntimeSelectionGuard } from '../../src/core/release/databaseAdapterRuntimeSelectionGuard';

const report = await runDatabaseAdapterRuntimeSelectionGuard();

describe('database adapter runtime selection guard', () => {
  it('passes all Phase 8.1 runtime-selection gates', () => {
    expect(report.gates).toMatchObject({
      databaseAdapterContractPassed: true,
      runtimeSelectionScriptExists: true,
      validateScriptRunsRuntimeSelectionGuard: true,
      runtimeSelectionModuleExists: true,
      runtimeSelectionGuardModuleExists: true,
      runtimeSelectionDocExists: true,
      phase81StatusDocExists: true,
      runtimeSelectionDefinesExpectedEnvMode: true,
      defaultUnsetModeSelectsMemory: true,
      explicitMemoryModeSelectsMemory: true,
      invalidModeFailsClosed: true,
      databaseModeWithoutEnvFailsClosed: true,
      databaseModeWithCompleteEnvIsContractOnly: true,
      routeAdapterFailsClosedForDatabaseMode: true,
      clientExposedDatabaseEnvBlocked: true,
      routeHandlersRemainDryRunInMemory: true,
      noDatabaseClientOrMigrationImplementation: true,
      noAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRoute: true,
      noRawAnswerOrFullResultTransportExpansion: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records the runtime mode contract and fail-closed database behavior', () => {
    expect(report.schemaVersion).toBe('phase-8.1-database-adapter-runtime-selection-guard-v1');
    expect(report.metadata.phaseScope).toBe('phase-8-1-runtime-selection-guard-only');
    expect(report.metadata.routeHandlerMode).toBe('next-route-files-dry-run-in-memory-only');
    expect(report.runtimeSelection).toMatchObject({
      modeEnv: 'PUBLIC_RESULT_STORAGE_MODE',
      allowedModes: ['memory', 'database'],
      defaultStatus: 'memory-selected',
      defaultAdapterKind: 'in-memory-public-result-storage-adapter',
      explicitMemoryStatus: 'memory-selected',
      invalidModeStatus: 'invalid-mode-blocked',
      missingDatabaseEnvStatus: 'database-blocked',
      completeDatabaseEnvStatus: 'database-configured-contract-only',
      completeDatabaseAdapterKind: 'server-only-public-result-database-adapter',
      completeDatabaseRouteBindingAllowed: false
    });
    expect(report.runtimeSelection.requiredDatabaseEnvKeys).toEqual([
      'PUBLIC_RESULT_DATABASE_URL',
      'PUBLIC_RESULT_DATABASE_PROVIDER',
      'PUBLIC_RESULT_DATABASE_SCHEMA_VERSION'
    ]);
  });

  it('keeps implementation scope clean before real database client integration', () => {
    expect(report.scripts.runtimeSelectionGuard).toBe('tsx scripts/database-adapter-runtime-selection-guard.ts');
    expect(report.scripts.validate).toContain('npm run guard:database-runtime-selection');
    expect(report.implementationScan.blockedPaths).toEqual([]);
    expect(report.implementationScan.blockedIntegrationSignals).toEqual([]);
    expect(report.implementationScan.persistentPublicLookupRouteFiles).toEqual([]);
    expect(report.implementationScan.rawOrFullResultSignals).toEqual([]);
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });

  it('tracks evidence coverage for the guard surface', () => {
    expect(report.coverage).toMatchObject({
      databaseAdapterIssueCount: 0,
      checkedFileCount: 5,
      guardRuleCount: 10,
      requiredDatabaseEnvKeyCount: 3,
      forbiddenPublicDatabaseEnvKeyCount: 4,
      blockedPathCount: 0,
      blockedIntegrationSignalCount: 0
    });
  });
});
