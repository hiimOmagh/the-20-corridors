import { describe, expect, it } from 'vitest';
import {
  buildCompletePublicResultLookupPageDatabaseDryRunEnvironment,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENABLED,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_MODE,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION,
  runPublicResultLookupPageDatabaseDryRun,
  summarizePublicResultLookupPageDatabaseDryRunRules
} from '../../src/core/public-link/publicResultLookupPageDatabaseDryRun';

describe('public result lookup page database dry-run', () => {
  it('simulates public lookup page read states through a fake database adapter', async () => {
    const report = await runPublicResultLookupPageDatabaseDryRun({
      env: buildCompletePublicResultLookupPageDatabaseDryRunEnvironment(),
      context: 'public-result-lookup-page-dry-run-contract',
      acknowledgeFakeExecutorOnly: true,
      acknowledgeActualPageLookupRemainsDisabled: true
    });

    expect(report).toMatchObject({
      schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION,
      mode: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_MODE,
      status: 'public-result-lookup-page-dry-run-passed',
      preflightStatus: 'public-result-lookup-page-preflight-ready-but-disabled',
      dryRunFlagPresent: true,
      preflightReady: true,
      fakeLookupAdapterCreated: true,
      lookupSimulationPassed: true,
      actualPublicLookupPageBindingApplied: false,
      realPublicResultPageDatabaseReadAllowed: false,
      realPublicResultPageDatabaseReadExecuted: false,
      productionNetworkLookupSmokeAllowed: false,
      networkQueryExecuted: false,
      productionMutationSmokeAllowed: false,
      persistentPublicLookupRoutePresent: false,
      rawDeleteTokenExposed: false,
      rawAnswersExposed: false,
      issues: []
    });
    expect(report.activeLookup).toMatchObject({ viewStatus: 'renderable', httpStatus: 200, storageStatus: 'active' });
    expect(report.activeLookup?.dto?.resultId).toBe(report.activeLookup?.publicId);
    expect(report.readMissLookup).toMatchObject({ viewStatus: 'not-found', httpStatus: 404, storageStatus: 'not-found', dto: null });
    expect(report.deletedLookup).toMatchObject({ viewStatus: 'deleted-unavailable', httpStatus: 410, storageStatus: 'deleted', dto: null });
    expect(report.expiredLookup).toMatchObject({ viewStatus: 'expired-unavailable', httpStatus: 410, storageStatus: 'expired', dto: null });
    expect(report.uniqueExecutedQueryIntents).toEqual(['read-active-public-result-by-public-id']);
    expect(report.queryIntentExecutionCount).toBe(4);
  });

  it('blocks missing dry-run flag, missing acknowledgement, and direct public page context', async () => {
    const completeEnv = buildCompletePublicResultLookupPageDatabaseDryRunEnvironment();
    const { [PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV]: _removed, ...missingDryRunFlagEnv } = completeEnv;

    const missingFlag = await runPublicResultLookupPageDatabaseDryRun({
      env: missingDryRunFlagEnv,
      context: 'public-result-lookup-page-dry-run-contract',
      acknowledgeFakeExecutorOnly: true,
      acknowledgeActualPageLookupRemainsDisabled: true
    });
    const missingAcknowledgement = await runPublicResultLookupPageDatabaseDryRun({
      env: completeEnv,
      context: 'public-result-lookup-page-dry-run-contract',
      acknowledgeActualPageLookupRemainsDisabled: true
    });
    const pageContext = await runPublicResultLookupPageDatabaseDryRun({
      env: completeEnv,
      context: 'public-result-page',
      acknowledgeFakeExecutorOnly: true,
      acknowledgeActualPageLookupRemainsDisabled: true
    });

    expect(missingFlag).toMatchObject({
      status: 'public-result-lookup-page-dry-run-blocked',
      dryRunFlagPresent: false,
      fakeLookupAdapterCreated: false
    });
    expect(missingFlag.issues).toContain('public_lookup_page_database_dry_run_flag_required:unset');

    expect(missingAcknowledgement).toMatchObject({
      status: 'public-result-lookup-page-dry-run-blocked',
      fakeExecutorOnlyAcknowledged: false,
      fakeLookupAdapterCreated: false
    });
    expect(missingAcknowledgement.issues).toContain('fake_executor_only_acknowledgement_required');

    expect(pageContext).toMatchObject({
      status: 'public-result-lookup-page-dry-run-blocked',
      context: 'public-result-page',
      actualPublicLookupPageBindingApplied: false
    });
    expect(pageContext.issues).toContain('public_result_lookup_page_dry_run_context_required:public-result-page');
    expect(pageContext.issues).toContain('public_result_page_context_blocked_until_lookup_page_activation_phase');
  });

  it('summarizes the Phase 8.17 dry-run flag and safety rules', () => {
    expect(summarizePublicResultLookupPageDatabaseDryRunRules()).toEqual(
      expect.arrayContaining([
        'phase:phase-8.17-public-result-lookup-page-dry-run-contract',
        `schema:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION}`,
        `flag:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV}=${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENABLED}`,
        'public-lookup-page-dry-run-uses-fake-executor-only',
        'read-miss-renders-not-found-behavior',
        'actual-public-r-public-id-page-lookup-remains-disabled'
      ])
    );
  });
});
