import { describe, expect, it } from 'vitest';
import {
  PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_SCHEMA_VERSION,
  runPublicResultLookupPageDryRunContract
} from '../../src/core/release/publicResultLookupPageDryRunContract';

describe('public result lookup page dry-run contract', () => {
  it('passes all Phase 8.17 dry-run gates', async () => {
    const report = await runPublicResultLookupPageDryRunContract();

    expect(report.schemaVersion).toBe(PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_SCHEMA_VERSION);
    expect(report.contractId).toBe(PUBLIC_RESULT_LOOKUP_PAGE_DRY_RUN_CONTRACT_ID);
    expect(report.gates).toMatchObject({
      preflightContractPassed: true,
      apiRouteDatabaseBindingGatePassed: true,
      rollbackFailureEvidencePackPassed: true,
      dryRunScriptExists: true,
      validateScriptRunsDryRun: true,
      dryRunModuleExists: true,
      dryRunGuardModuleExists: true,
      dryRunDocExists: true,
      phase817StatusDocExists: true,
      dryRunFlagDefined: true,
      preflightReady: true,
      fakeExecutorOnly: true,
      fakeLookupAdapterCreated: true,
      activeLookupRenderable: true,
      readMissReturnsNotFound: true,
      deletedResultUnavailable: true,
      expiredResultUnavailable: true,
      actualPublicLookupPageBindingNotApplied: true,
      noRealPublicPageDatabaseRead: true,
      noPersistentPublicLookupRoute: true,
      noNetworkLookupSmoke: true,
      noProductionMutationSmoke: true,
      noPrivateDataExposure: true,
      noBlockedIntegrationSignals: true,
      overallPassed: true
    });
    expect(report.dryRun).toMatchObject({
      status: 'public-result-lookup-page-dry-run-passed',
      activeLookupStatus: 'renderable',
      activeLookupHttpStatus: 200,
      readMissStatus: 'not-found',
      readMissHttpStatus: 404,
      deletedLookupStatus: 'deleted-unavailable',
      deletedLookupHttpStatus: 410,
      expiredLookupStatus: 'expired-unavailable',
      expiredLookupHttpStatus: 410,
      lookupSimulationPassed: true,
      actualPublicLookupPageBindingApplied: false,
      realPublicResultPageDatabaseReadExecuted: false,
      networkQueryExecuted: false
    });
    expect(report.coverage).toMatchObject({
      persistentRouteCount: 0,
      publicPageDatabaseReadSignalCount: 0,
      blockedIntegrationSignalCount: 0
    });
    expect(report.issues).toEqual([]);
  });

  it('records the dry-run query intent evidence', async () => {
    const report = await runPublicResultLookupPageDryRunContract();

    expect(report.dryRun.executedQueryIntents).toEqual([
      'read-active-public-result-by-public-id',
      'read-active-public-result-by-public-id',
      'read-active-public-result-by-public-id',
      'read-active-public-result-by-public-id'
    ]);
    expect(report.dryRun.queryIntentExecutionCount).toBe(4);
  });
});
