import { describe, expect, it } from 'vitest';
import { runDatabaseAdapterFactoryContract } from '../../src/core/release/databaseAdapterFactoryContract';

describe('database adapter factory contract', () => {
  it('passes the Phase 8.2 factory boundary gates', async () => {
    const report = await runDatabaseAdapterFactoryContract();

    expect(report.gates).toMatchObject({
      databaseAdapterContractPassed: true,
      runtimeSelectionGuardPassed: true,
      factoryScriptExists: true,
      validateScriptRunsFactoryContract: true,
      factoryModuleExists: true,
      factoryGuardModuleExists: true,
      factoryDocExists: true,
      phase82StatusDocExists: true,
      factoryDefinesExpectedBoundary: true,
      unsetModeCreatesMemoryAdapter: true,
      explicitMemoryModeCreatesMemoryAdapter: true,
      databaseModeIsContractOnly: true,
      databaseModeDoesNotCreateAdapter: true,
      databaseModeRouteFactoryThrows: true,
      missingDatabaseEnvFailsClosed: true,
      routeHandlersUseFactoryBoundary: true,
      routeHandlersRemainDryRunInMemory: true,
      noDatabaseClientOrMigrationImplementation: true,
      noAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRoute: true,
      noRawAnswerOrFullResultTransportExpansion: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records factory coverage and route-binding constraints', async () => {
    const report = await runDatabaseAdapterFactoryContract();

    expect(report.factory).toMatchObject({
      modeEnv: 'PUBLIC_RESULT_STORAGE_MODE',
      factoryMode: 'memory-default-database-contract-only-no-route-binding',
      unsetModeStatus: 'memory-adapter-created',
      explicitMemoryStatus: 'memory-adapter-created',
      completeDatabaseStatus: 'database-factory-contract-only',
      completeDatabaseAdapterKind: 'server-only-public-result-database-adapter',
      completeDatabaseRouteBindingAllowed: false,
      completeDatabaseAdapterCreated: false,
      missingDatabaseStatus: 'factory-blocked'
    });
    expect(report.factory.factoryRules).toContain('database-mode-does-not-create-real-adapter');
    expect(report.coverage).toMatchObject({
      databaseAdapterIssueCount: 0,
      runtimeSelectionIssueCount: 0,
      checkedFileCount: 6,
      factoryRuleCount: expect.any(Number),
      blockedPathCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0,
      rawOrFullResultSignalCount: 0
    });
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });
});
