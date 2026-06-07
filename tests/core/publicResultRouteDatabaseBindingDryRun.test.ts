import { describe, expect, it } from 'vitest';
import {
  buildCompletePublicResultRouteDatabaseBindingDryRunEnvironment,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENABLED,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_MODE,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION,
  runPublicResultRouteDatabaseBindingDryRun,
  summarizePublicResultRouteDatabaseBindingDryRunRules
} from '../../src/core/public-link/publicResultRouteDatabaseBindingDryRun';

describe('public result route database binding dry-run', () => {
  it('simulates route create/read/delete/prune through a fake route-bound database adapter', async () => {
    const report = await runPublicResultRouteDatabaseBindingDryRun({
      env: buildCompletePublicResultRouteDatabaseBindingDryRunEnvironment(),
      context: 'route-binding-dry-run-contract',
      acknowledgeFakeExecutorOnly: true
    });

    expect(report).toMatchObject({
      schemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION,
      mode: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_MODE,
      status: 'route-database-binding-dry-run-passed',
      preflightStatus: 'route-database-binding-preflight-ready-but-disabled',
      dryRunFlagPresent: true,
      preflightReady: true,
      fakeExecutorOnlyAcknowledged: true,
      fakeRouteBoundDatabaseAdapterCreated: true,
      createStatusCode: 201,
      readStatusCode: 200,
      deleteStatusCode: 200,
      readAfterDeleteStatusCode: 410,
      pruneDeletedCount: 1,
      routeHandlerCreateReadDeletePruneSimulationPassed: true,
      fakeExecutorRowCountAfterPrune: 0,
      routeBindingAllowed: false,
      routeHandlerBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      persistentPublicLookupAllowed: false,
      actualPublicRouteHandlersRemainMemoryDryRun: true,
      publicApiRoutesRemainMemoryDryRun: true,
      issues: []
    });
    expect(report.uniqueExecutedQueryIntents).toEqual(
      expect.arrayContaining([
        'insert-public-result-record',
        'read-active-public-result-by-public-id',
        'verify-delete-token-hash-for-public-id',
        'soft-delete-public-result-by-public-id',
        'mark-expired-public-results',
        'prune-deleted-or-expired-public-results'
      ])
    );
    expect(report.queryIntentExecutionCount).toBeGreaterThanOrEqual(7);
  });

  it('blocks missing dry-run flag, missing acknowledgement, and route-handler context', async () => {
    const completeEnv = buildCompletePublicResultRouteDatabaseBindingDryRunEnvironment();
    const { [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV]: _removed, ...missingDryRunFlagEnv } = completeEnv;

    const missingFlag = await runPublicResultRouteDatabaseBindingDryRun({
      env: missingDryRunFlagEnv,
      context: 'route-binding-dry-run-contract',
      acknowledgeFakeExecutorOnly: true
    });
    const missingAcknowledgement = await runPublicResultRouteDatabaseBindingDryRun({
      env: completeEnv,
      context: 'route-binding-dry-run-contract'
    });
    const routeHandlerContext = await runPublicResultRouteDatabaseBindingDryRun({
      env: completeEnv,
      context: 'public-api-route-handler',
      acknowledgeFakeExecutorOnly: true
    });

    expect(missingFlag).toMatchObject({
      status: 'route-database-binding-dry-run-blocked',
      dryRunFlagPresent: false,
      fakeRouteBoundDatabaseAdapterCreated: false,
      routeBindingAllowed: false
    });
    expect(missingFlag.issues).toContain('route_database_binding_dry_run_flag_required:unset');

    expect(missingAcknowledgement).toMatchObject({
      status: 'route-database-binding-dry-run-blocked',
      fakeExecutorOnlyAcknowledged: false,
      fakeRouteBoundDatabaseAdapterCreated: false
    });
    expect(missingAcknowledgement.issues).toContain('fake_executor_only_acknowledgement_required');

    expect(routeHandlerContext).toMatchObject({
      status: 'route-database-binding-dry-run-blocked',
      context: 'public-api-route-handler',
      routeBindingAllowed: false,
      routeHandlerBindingAllowed: false
    });
    expect(routeHandlerContext.issues).toContain('public_api_route_handler_context_database_binding_dry_run_blocked');
  });

  it('summarizes the Phase 8.12 dry-run flag and safety rules', () => {
    expect(summarizePublicResultRouteDatabaseBindingDryRunRules()).toEqual(
      expect.arrayContaining([
        'phase:phase-8.12-public-route-database-binding-dry-run-contract',
        `schema:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION}`,
        `flag:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV}=${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENABLED}`,
        'route-binding-dry-run-uses-fake-executor-only',
        'actual-public-route-adapter-resolver-remains-memory-dry-run',
        'no-production-database-mutation-smoke'
      ])
    );
  });
});
