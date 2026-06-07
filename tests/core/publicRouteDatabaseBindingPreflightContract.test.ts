import { describe, expect, it } from 'vitest';
import { runPublicRouteDatabaseBindingPreflightContract } from '../../src/core/release/publicRouteDatabaseBindingPreflightContract';

describe('public route database binding preflight contract', () => {
  it('passes the Phase 8.11 preflight gates', async () => {
    const report = await runPublicRouteDatabaseBindingPreflightContract();

    expect(report.gates).toMatchObject({
      factoryActivationContractPassed: true,
      adapterActivationDryRunGatePassed: true,
      adapterImplementationGatePassed: true,
      queryReadinessGuardPassed: true,
      clientSmokeBoundaryPassed: true,
      preflightScriptExists: true,
      validateScriptRunsPreflight: true,
      preflightModuleExists: true,
      preflightGuardModuleExists: true,
      preflightDocExists: true,
      phase811StatusDocExists: true,
      routeBindingFlagRequired: true,
      completeDatabaseEnvRequired: true,
      databaseModeAloneInsufficient: true,
      explicitFlagStillDoesNotActivateRoutes: true,
      routeHandlerContextCannotBindDatabase: true,
      routeBindingRemainsDisabled: true,
      routeHandlersRemainMemoryDryRun: true,
      noProductionMutationSmoke: true,
      noNetworkQueryExecution: true,
      noPersistentPublicLookupRoute: true,
      noAuthPaymentAiAnalyticsTelemetryImplementation: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records ready-but-disabled route preflight state', async () => {
    const report = await runPublicRouteDatabaseBindingPreflightContract();

    expect(report.preflight).toMatchObject({
      status: 'route-database-binding-preflight-ready-but-disabled',
      databaseModeAloneStatus: 'route-database-binding-preflight-blocked',
      missingFlagStatus: 'route-database-binding-preflight-blocked',
      routeHandlerContextStatus: 'route-database-binding-preflight-blocked',
      missingEnvStatus: 'route-database-binding-preflight-blocked',
      preflightReady: true,
      routeBindingAllowed: false,
      routeHandlerBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryAllowed: false,
      persistentPublicLookupAllowed: false
    });
    expect(report.coverage).toMatchObject({
      factoryActivationIssueCount: 0,
      activationDryRunIssueCount: 0,
      adapterImplementationIssueCount: 0,
      queryReadinessIssueCount: 0,
      clientSmokeIssueCount: 0,
      checkedFileCount: 9,
      routeBindingSignalCount: 0,
      productionMutationSmokeSignalCount: 0,
      networkExecutionSignalCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0
    });
    expect(report.preflight.preflightRules).toContain('public-api-routes-remain-memory-dry-run');
  });
});
