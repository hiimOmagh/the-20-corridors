import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_SCHEMA_VERSION,
  runPublicResultLookupPageActivationContract
} from '../../src/core/release/publicResultLookupPageActivationContract';

describe('public result lookup page activation contract', () => {
  it('passes all Phase 8.18 activation-decision gates', async () => {
    const report = await runPublicResultLookupPageActivationContract();

    expect(report.schemaVersion).toBe(PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_SCHEMA_VERSION);
    expect(report.contractId).toBe(PUBLIC_RESULT_LOOKUP_PAGE_ACTIVATION_CONTRACT_ID);
    expect(report.gates).toMatchObject({
      preflightContractPassed: true,
      dryRunContractPassed: true,
      apiRouteDatabaseBindingGatePassed: true,
      rollbackFailureEvidencePackPassed: true,
      activationScriptExists: true,
      validateScriptRunsActivation: true,
      activationModuleExists: true,
      activationGuardModuleExists: true,
      activationDocExists: true,
      phase818StatusDocExists: true,
      activationFlagDefined: true,
      activationDecisionReady: true,
      activationRequiresCompleteDatabaseEnv: true,
      activationRequiresApiRouteDatabaseBinding: true,
      activationDoesNotBypassRollback: true,
      actualPublicLookupPageBindingNotApplied: true,
      noRealPublicPageDatabaseRead: true,
      noPersistentPublicLookupRoute: true,
      noNetworkLookupSmoke: true,
      noProductionMutationSmoke: true,
      publicPageRouteImplementationSeparate: true,
      noBlockedIntegrationSignals: true,
      overallPassed: true
    });
    expect(report.activation).toMatchObject({
      status: 'public-result-lookup-page-activation-ready-not-applied',
      preflightStatus: 'public-result-lookup-page-preflight-ready-but-disabled',
      dryRunStatus: 'public-result-lookup-page-dry-run-passed',
      completeDatabaseEnvPresent: true,
      apiRouteDatabaseBindingGateValid: true,
      activationDecisionReady: true,
      actualPublicLookupPageBindingApplied: false,
      publicPageDatabaseReadAllowed: false,
      realPublicResultPageDatabaseReadExecuted: false,
      networkLookupExecuted: false,
      publicPageRouteImplementationAllowed: false,
      apiRoutePersistenceRollbackStillAvailable: true
    });
    expect(report.coverage).toMatchObject({
      persistentRouteCount: 0,
      publicPageDatabaseReadSignalCount: 0,
      blockedIntegrationSignalCount: 0
    });
    expect(report.issues).toEqual([]);
  });

  it('records the public lookup activation flag contract', async () => {
    const report = await runPublicResultLookupPageActivationContract();

    expect(report.activation.activationFlagEnv).toBe('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION');
    expect(report.activation.activationFlagRequiredValue).toBe('enabled');
    expect(report.activation.rules).toContain('public-result-lookup-page-activation-does-not-bypass-api-route-rollback-mode');
  });
});
