import { describe, expect, it } from 'vitest';
import {
  createPublicResultLookupPageImplementationFixtureAdapter,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MODE,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION,
  resolvePublicResultLookupPageImplementationView,
  summarizePublicResultLookupPageImplementationRules
} from '../../src/core/public-link/publicResultLookupPageImplementation';
import { buildCompletePublicResultLookupPageDatabaseActivationEnvironment } from '../../src/core/public-link/publicResultLookupPageDatabaseActivation';

const env = buildCompletePublicResultLookupPageDatabaseActivationEnvironment();

describe('public result lookup page implementation', () => {
  it('renders active, missing, deleted, and expired states behind activation', async () => {
    const adapter = createPublicResultLookupPageImplementationFixtureAdapter();
    const active = await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
      env,
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    });
    const missing = await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
      env,
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    });
    const deleted = await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
      env,
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    });
    const expired = await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
      env,
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    });

    expect(active).toMatchObject({
      schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION,
      mode: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MODE,
      status: 'public-result-page-renderable',
      httpStatus: 200,
      storageStatus: 'active',
      databaseReadExecuted: true,
      networkLookupSmokeExecuted: false,
      productionMutationSmokeExecuted: false,
      publicPageRouteImplemented: true,
      actualPublicLookupPageBindingApplied: true,
      rawDeleteTokenExposed: false,
      rawAnswersExposed: false,
      publicDtoOnly: true,
      issues: []
    });
    expect(active.dto?.resultId).toBe(PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID);
    expect(JSON.stringify(active.dto)).not.toContain('rawAnswers');
    expect(JSON.stringify(active.dto)).not.toContain('questionAnswers');

    expect(missing).toMatchObject({ status: 'public-result-page-not-found', httpStatus: 404, storageStatus: 'not-found', dto: null });
    expect(deleted).toMatchObject({ status: 'public-result-page-deleted-unavailable', httpStatus: 410, storageStatus: 'deleted', dto: null });
    expect(expired).toMatchObject({ status: 'public-result-page-expired-unavailable', httpStatus: 410, storageStatus: 'expired', dto: null });
  });

  it('keeps default and rollback behavior safe', async () => {
    const adapter = createPublicResultLookupPageImplementationFixtureAdapter();
    const fallback = await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
      env: {},
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    });
    const rollback = await resolvePublicResultLookupPageImplementationView({
      publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
      env: { ...env, PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK: 'memory' },
      context: 'public-result-lookup-page-implementation-gate',
      adapter
    });

    expect(fallback).toMatchObject({
      status: 'public-result-page-disabled',
      httpStatus: 404,
      databaseReadAttempted: false,
      databaseReadExecuted: false,
      actualPublicLookupPageBindingApplied: false
    });
    expect(rollback).toMatchObject({
      status: 'public-result-page-disabled',
      httpStatus: 503,
      rollbackToMemoryRequested: true,
      databaseReadAttempted: false,
      databaseReadExecuted: false,
      actualPublicLookupPageBindingApplied: false
    });
  });

  it('summarizes the route path and safety rules', () => {
    expect(summarizePublicResultLookupPageImplementationRules()).toEqual(
      expect.arrayContaining([
        `schema:${PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_SCHEMA_VERSION}`,
        `route:${PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ROUTE_PATH}`,
        'public-result-lookup-page-implementation-is-behind-phase-8-18-activation-decision',
        'rollback-to-memory-blocks-public-page-database-lookup',
        'renderable-result-exposes-dto-only-public-fields'
      ])
    );
  });
});
