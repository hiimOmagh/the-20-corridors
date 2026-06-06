import { describe, expect, it } from 'vitest';
import { runDatabaseClientConfigurationContract } from '../../src/core/release/databaseClientConfigurationContract';

describe('database client configuration contract', () => {
  it('passes the Phase 8.3 database-client configuration gates', async () => {
    const report = await runDatabaseClientConfigurationContract();

    expect(report.gates).toMatchObject({
      databaseAdapterContractPassed: true,
      runtimeSelectionGuardPassed: true,
      adapterFactoryContractPassed: true,
      configScriptExists: true,
      validateScriptRunsConfigContract: true,
      configModuleExists: true,
      configGuardModuleExists: true,
      configDocExists: true,
      phase83StatusDocExists: true,
      envNamesCentralized: true,
      serverOnlyEnvAccessDefined: true,
      clientExposedEnvNamesBlocked: true,
      databaseUrlValidationContractOnly: true,
      serviceKeyValidationContractOnly: true,
      completeConfigIsContractOnly: true,
      incompleteConfigFailsClosed: true,
      publicEnvFailsClosed: true,
      factoryStillCannotCreateDatabaseAdapter: true,
      routesRemainMemoryDryRun: true,
      noDatabaseSdkImportOrMigrationImplementation: true,
      noAuthPaymentAiAnalyticsImplementation: true,
      noPersistentPublicLookupRoute: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records config coverage and keeps route/database client creation blocked', async () => {
    const report = await runDatabaseClientConfigurationContract();

    expect(report.schemaVersion).toBe('phase-8.3-database-client-configuration-contract-v1');
    expect(report.metadata.phaseScope).toBe('phase-8-3-database-client-config-contract-only');
    expect(report.config).toMatchObject({
      configMode: 'server-only-env-contract-no-client-instantiation',
      completeConfigStatus: 'configured-contract-only',
      databaseUrlStatus: 'configured-valid-contract-only',
      serviceKeyStatus: 'configured-valid-contract-only',
      databaseClientCreationAllowed: false,
      routeBindingAllowed: false,
      missingConfigStatus: 'blocked',
      publicEnvStatus: 'blocked',
      factoryDatabaseStatus: 'database-factory-contract-only',
      factoryDatabaseAdapterCreated: false
    });
    expect(report.config.requiredDatabaseEnvKeys).toEqual([
      'PUBLIC_RESULT_DATABASE_URL',
      'PUBLIC_RESULT_DATABASE_PROVIDER',
      'PUBLIC_RESULT_DATABASE_SCHEMA_VERSION'
    ]);
    expect(report.config.serverOnlyDatabaseEnvKeys).toContain('PUBLIC_RESULT_DATABASE_SERVICE_KEY');
    expect(report.config.forbiddenPublicDatabaseEnvKeys).toContain('NEXT_PUBLIC_PUBLIC_RESULT_DATABASE_SERVICE_KEY');
    expect(report.coverage).toMatchObject({
      databaseAdapterIssueCount: 0,
      runtimeSelectionIssueCount: 0,
      adapterFactoryIssueCount: 0,
      checkedFileCount: 7,
      implementationFileCount: 4,
      configRuleCount: expect.any(Number),
      requiredDatabaseEnvKeyCount: 3,
      serverOnlyDatabaseEnvKeyCount: 4,
      forbiddenPublicDatabaseEnvKeyCount: 4,
      blockedPathCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0
    });
    expect(report.implementationScan.missingContractPhrases).toEqual([]);
  });
});
