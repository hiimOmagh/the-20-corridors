import { describe, expect, it } from 'vitest';
import {
  buildCompletePublicLookupOperationalRollbackDrillEnvironment,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENABLED,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENV,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_ENV,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_FAKE_EXECUTOR,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SCHEMA_VERSION,
  runPublicLookupOperationalRollbackDrill,
  summarizePublicLookupOperationalRollbackDrillRules
} from '../../src/core/public-link/publicResultLookupOperationalRollbackDrill';
import {
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY
} from '../../src/core/public-link/publicResultApiRouteDatabaseBindingImplementation';

const completeEnv = buildCompletePublicLookupOperationalRollbackDrillEnvironment();

describe('public lookup operational rollback drill', () => {
  it('proves rollback across API route persistence and public lookup rendering', async () => {
    const report = await runPublicLookupOperationalRollbackDrill({
      env: completeEnv,
      context: 'public-lookup-operational-rollback-drill'
    });

    expect(report).toMatchObject({
      schemaVersion: PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SCHEMA_VERSION,
      status: 'public-lookup-operational-rollback-drill-passed',
      drillOptIn: true,
      fakeExecutorOnly: true,
      apiRouteDatabaseBindingBeforeRollbackStatus: 'database-adapter-selected-for-public-api-route',
      apiRouteDatabaseBindingBeforeRollbackActive: true,
      publicLookupBeforeRollbackStatus: 'public-result-page-renderable',
      publicLookupBeforeRollbackHttpStatus: 200,
      publicLookupBeforeRollbackRenderable: true,
      operationalSmokeBeforeRollbackStatus: 'public-result-lookup-operational-smoke-passed',
      rollbackFlagApplied: true,
      apiRouteStorageAfterRollbackStatus: 'memory-adapter-selected-rollback',
      apiRouteStorageAfterRollbackMemorySelected: true,
      rollbackDisablesPublicLookupRendering: true,
      rollbackDoesNotExposeStaleDatabaseDto: true,
      unavailableStatesRemainDtoFreeAfterRollback: true,
      deletedExpiredMissingStatesVerifiedBeforeRollback: true,
      rawAnswersExposed: false,
      rawDeleteTokenExposed: false,
      networkLookupSmokeExecuted: false,
      productionNetworkLookupSmokeExecuted: false,
      productionMutationSmokeExecuted: false,
      issues: []
    });
    expect(report.publicLookupAfterRollback).toMatchObject({
      status: 'public-result-page-disabled',
      httpStatus: 503,
      dtoPresent: false,
      databaseReadAttempted: false,
      databaseReadExecuted: false
    });
    expect(report.missingAfterRollback.dtoPresent).toBe(false);
    expect(report.deletedAfterRollback.dtoPresent).toBe(false);
    expect(report.expiredAfterRollback.dtoPresent).toBe(false);
  });

  it('blocks missing opt-in or missing fake-executor safe mode before accepting the drill', async () => {
    const missingOptIn = await runPublicLookupOperationalRollbackDrill({
      env: {},
      context: 'public-lookup-operational-rollback-drill'
    });
    const missingSafeMode = await runPublicLookupOperationalRollbackDrill({
      env: {
        ...completeEnv,
        [PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_ENV]: 'network'
      },
      context: 'public-lookup-operational-rollback-drill'
    });

    expect(missingOptIn.status).toBe('public-lookup-operational-rollback-drill-blocked');
    expect(missingOptIn.issues).toEqual(expect.arrayContaining(['rollback_drill_opt_in_required']));
    expect(missingSafeMode.status).toBe('public-lookup-operational-rollback-drill-blocked');
    expect(missingSafeMode.issues).toEqual(expect.arrayContaining([expect.stringContaining('rollback_drill_fake_executor_safe_mode_required')]));
  });

  it('summarizes rollback drill safety rules', () => {
    expect(summarizePublicLookupOperationalRollbackDrillRules()).toEqual(
      expect.arrayContaining([
        `flag:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENV}=${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENABLED}`,
        `safeMode:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_ENV}=${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_FAKE_EXECUTOR}`,
        `rollback:${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV}=${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY}`,
        'single-rollback-flag-forces-api-route-storage-to-memory',
        'single-rollback-flag-disables-public-lookup-rendering',
        'rollback-does-not-expose-stale-database-dto'
      ])
    );
  });
});
