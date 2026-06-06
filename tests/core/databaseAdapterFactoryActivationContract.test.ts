import { describe, expect, it } from 'vitest';
import { runDatabaseAdapterFactoryActivationContract } from '../../src/core/release/databaseAdapterFactoryActivationContract';

describe('database adapter factory activation contract', () => {
  it('passes the Phase 8.10 factory activation gates', async () => {
    const report = await runDatabaseAdapterFactoryActivationContract();

    expect(report.gates).toMatchObject({
      activationDryRunGatePassed: true,
      adapterImplementationGatePassed: true,
      queryReadinessGuardPassed: true,
      clientSmokeBoundaryPassed: true,
      factoryActivationScriptExists: true,
      validateScriptRunsFactoryActivation: true,
      factoryActivationModuleExists: true,
      factoryActivationGuardModuleExists: true,
      factoryActivationDocExists: true,
      phase810StatusDocExists: true,
      explicitNonRouteFactoryCreatesDatabaseAdapter: true,
      databaseModeAloneDoesNotCreateAdapter: true,
      routeHandlerContextCannotCreateDatabaseAdapter: true,
      missingDatabaseEnvFailsClosed: true,
      factoryRouteBindingRemainsDisabled: true,
      routeHandlersRemainMemoryDryRun: true,
      noProductionMutationSmoke: true,
      noNetworkQueryExecution: true,
      noPersistentPublicLookupRoute: true,
      noAuthPaymentAiAnalyticsTelemetryImplementation: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records non-route adapter creation while route binding remains blocked', async () => {
    const report = await runDatabaseAdapterFactoryActivationContract();

    expect(report.activation).toMatchObject({
      status: 'database-adapter-created-non-route-factory-context',
      defaultDatabaseModeStatus: 'database-adapter-factory-activation-blocked',
      routeHandlerContextStatus: 'database-adapter-factory-activation-blocked',
      missingEnvStatus: 'database-adapter-factory-activation-blocked',
      databaseAdapterCreated: true,
      routeBindingAllowed: false,
      routeHandlerBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      createStatus: 'active',
      readStatus: 'active',
      deleteStatus: 'deleted',
      pruneDeletedCount: 1
    });
    expect(report.coverage).toMatchObject({
      activationDryRunIssueCount: 0,
      adapterImplementationIssueCount: 0,
      queryReadinessIssueCount: 0,
      clientSmokeIssueCount: 0,
      checkedFileCount: 8,
      routeBindingSignalCount: 0,
      productionMutationSmokeSignalCount: 0,
      networkExecutionSignalCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0
    });
    expect(report.activation.factoryActivationRules).toContain('factory-activation-requires-explicit-non-route-context');
  });
});
