import { describe, expect, it } from 'vitest';
import { runPublicRouteDatabaseBindingActivationContract } from '../../src/core/release/publicRouteDatabaseBindingActivationContract';

describe('public route database binding activation contract', () => {
  it('passes the Phase 8.13 activation-decision gates without applying route binding', async () => {
    const report = await runPublicRouteDatabaseBindingActivationContract();

    expect(report.gates).toMatchObject({
      routeBindingDryRunContractPassed: true,
      routeBindingPreflightContractPassed: true,
      factoryActivationContractPassed: true,
      activationScriptExists: true,
      validateScriptRunsActivation: true,
      activationModuleExists: true,
      activationGuardModuleExists: true,
      activationDocExists: true,
      phase813StatusDocExists: true,
      activationFlagRequired: true,
      activationDecisionReady: true,
      databaseModeAloneStillBlocked: true,
      missingActivationFlagStillBlocked: true,
      publicApiRouteHandlerContextStillBlocked: true,
      publicLookupContextStillBlocked: true,
      publicLookupActivationFlagStillBlocked: true,
      apiRouteActivationSeparatedFromPublicLookup: true,
      actualRouteHandlersRemainMemoryDryRun: true,
      productionRouteBindingNotApplied: true,
      noProductionMutationSmoke: true,
      noNetworkQueryExecution: true,
      noPersistentPublicLookupRoute: true,
      noAuthPaymentAiAnalyticsTelemetryImplementation: true,
      overallPassed: true
    });
    expect(report.issues).toEqual([]);
  });

  it('records API route activation readiness separately from implementation and public lookup', async () => {
    const report = await runPublicRouteDatabaseBindingActivationContract();

    expect(report.activation).toMatchObject({
      status: 'api-route-database-binding-activation-ready-not-applied',
      databaseModeAloneStatus: 'api-route-database-binding-activation-blocked',
      missingActivationFlagStatus: 'api-route-database-binding-activation-blocked',
      publicApiRouteHandlerContextStatus: 'api-route-database-binding-activation-blocked',
      publicLookupContextStatus: 'api-route-database-binding-activation-blocked',
      publicLookupFlagEnabledStatus: 'api-route-database-binding-activation-blocked',
      dryRunStatus: 'route-database-binding-dry-run-passed',
      preflightStatus: 'route-database-binding-preflight-ready-but-disabled',
      fakeRouteBoundAdapterCreatedInDryRun: true,
      routeFlowSimulationPassed: true,
      apiRouteDatabaseBindingActivationReady: true,
      actualRouteBindingApplied: false,
      actualRouteHandlersRemainMemoryDryRun: true,
      publicResultPageLookupActivationAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      persistentPublicLookupAllowed: false
    });
    expect(report.coverage).toMatchObject({
      activationIssueCount: 0,
      checkedFileCount: 8,
      appliedRouteBindingSignalCount: 0,
      productionMutationSmokeSignalCount: 0,
      networkExecutionSignalCount: 0,
      blockedIntegrationSignalCount: 0,
      persistentRouteCount: 0
    });
    expect(report.activation.activationRules).toContain('public-r-public-id-page-lookup-activation-is-separate-and-blocked');
  });
});
