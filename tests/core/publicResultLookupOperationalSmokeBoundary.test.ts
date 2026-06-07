import { describe, expect, it } from 'vitest';
import {
  buildCompletePublicResultLookupOperationalSmokeEnvironment,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_MODE,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENV,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENABLED,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT_ENV,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_ENV,
  PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_FAKE_EXECUTOR,
  runPublicResultLookupOperationalSmokeBoundary,
  summarizePublicResultLookupOperationalSmokeRules
} from '../../src/core/public-link/publicResultLookupOperationalSmokeBoundary';
import {
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY
} from '../../src/core/public-link/publicResultApiRouteDatabaseBindingImplementation';

const completeEnv = buildCompletePublicResultLookupOperationalSmokeEnvironment();

describe('public result lookup operational smoke boundary', () => {
  it('runs opt-in non-production fake-executor smoke for all public lookup states', async () => {
    const report = await runPublicResultLookupOperationalSmokeBoundary({
      env: completeEnv,
      context: 'public-result-lookup-operational-smoke-boundary'
    });

    expect(report).toMatchObject({
      schemaVersion: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION,
      mode: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_MODE,
      status: 'public-result-lookup-operational-smoke-passed',
      operationalSmokeOptIn: true,
      nonProductionEnvironmentConfirmed: true,
      safeModeConfirmed: true,
      fakeExecutorOnly: true,
      dtoOnlyRenderingVerified: true,
      deletedExpiredMissingExposeNoDto: true,
      rawAnswersExposed: false,
      rawDeleteTokenExposed: false,
      networkLookupSmokeExecuted: false,
      productionNetworkLookupSmokeExecuted: false,
      productionMutationSmokeExecuted: false,
      issues: []
    });
    expect(report.activeLookup).toMatchObject({ status: 'public-result-page-renderable', httpStatus: 200, dtoPresent: true, publicDtoOnly: true });
    expect(report.readMissLookup).toMatchObject({ status: 'public-result-page-not-found', httpStatus: 404, dtoPresent: false });
    expect(report.deletedLookup).toMatchObject({ status: 'public-result-page-deleted-unavailable', httpStatus: 410, dtoPresent: false });
    expect(report.expiredLookup).toMatchObject({ status: 'public-result-page-expired-unavailable', httpStatus: 410, dtoPresent: false });
  });

  it('blocks default, production, and rollback smoke attempts before lookup execution', async () => {
    const defaultReport = await runPublicResultLookupOperationalSmokeBoundary({
      env: {},
      context: 'public-result-lookup-operational-smoke-boundary'
    });
    const productionReport = await runPublicResultLookupOperationalSmokeBoundary({
      env: { ...completeEnv, [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT_ENV]: 'production' },
      context: 'public-result-lookup-operational-smoke-boundary'
    });
    const rollbackReport = await runPublicResultLookupOperationalSmokeBoundary({
      env: { ...completeEnv, [PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV]: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY },
      context: 'public-result-lookup-operational-smoke-boundary'
    });

    expect(defaultReport).toMatchObject({ status: 'public-result-lookup-operational-smoke-blocked', operationalSmokeOptIn: false });
    expect(defaultReport.activeLookup.databaseReadExecuted).toBe(false);
    expect(productionReport).toMatchObject({ status: 'public-result-lookup-operational-smoke-blocked', productionEnvironmentRejected: true });
    expect(productionReport.activeLookup.databaseReadExecuted).toBe(false);
    expect(rollbackReport).toMatchObject({ status: 'public-result-lookup-operational-smoke-blocked', rollbackToMemoryRequested: true });
    expect(rollbackReport.activeLookup.databaseReadExecuted).toBe(false);
  });

  it('fails closed on missing database activation environment even when smoke flags are present', async () => {
    const report = await runPublicResultLookupOperationalSmokeBoundary({
      env: {
        [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENV]: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENABLED,
        [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT_ENV]: 'non-production',
        [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_ENV]: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_FAKE_EXECUTOR
      },
      context: 'public-result-lookup-operational-smoke-boundary'
    });

    expect(report.status).toBe('public-result-lookup-operational-smoke-configuration-error');
    expect(report.networkLookupSmokeExecuted).toBe(false);
    expect(report.productionNetworkLookupSmokeExecuted).toBe(false);
    expect(report.issues).toEqual(expect.arrayContaining([expect.stringContaining('active_lookup_not_renderable')]));
  });

  it('summarizes opt-in and safety rules', () => {
    expect(summarizePublicResultLookupOperationalSmokeRules()).toEqual(
      expect.arrayContaining([
        `schema:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION}`,
        `flag:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENV}=${PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENABLED}`,
        'public-result-lookup-operational-smoke-is-explicit-opt-in-only',
        'public-result-lookup-operational-smoke-refuses-production-environment',
        'public-result-lookup-operational-smoke-runs-no-production-network-lookup-by-default'
      ])
    );
  });
});
