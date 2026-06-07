import { describe, expect, it } from 'vitest';
import {
  buildApiRouteDatabaseBindingWithoutPublicLookupEnvironment,
  buildCompletePublicResultLookupPageDatabasePreflightEnvironment,
  buildPublicResultLookupPageDatabasePreflightRollbackEnvironment,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED,
  resolvePublicResultLookupPageDatabasePreflightDecision
} from '../../src/core/public-link/publicResultLookupPageDatabasePreflight';

describe('public result lookup page database preflight', () => {
  it('becomes ready but disabled only with explicit lookup flags and acknowledgements', () => {
    const decision = resolvePublicResultLookupPageDatabasePreflightDecision({
      env: buildCompletePublicResultLookupPageDatabasePreflightEnvironment(),
      context: 'public-result-lookup-page-preflight',
      acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
      acknowledgePublicLookupRemainsDisabled: true,
      acknowledgeNoPublicPageDatabaseRead: true
    });

    expect(decision.status).toBe('public-result-lookup-page-preflight-ready-but-disabled');
    expect(decision.requestedPublicLookupActivationFlag).toBe(PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED);
    expect(decision.requestedPublicLookupPreflightFlag).toBe(PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED);
    expect(decision.publicLookupPreflightReady).toBe(true);
    expect(decision.actualPublicLookupPageBindingApplied).toBe(false);
    expect(decision.publicLookupRemainsDisabled).toBe(true);
    expect(decision.publicPageDatabaseReadAllowed).toBe(false);
    expect(decision.networkQueryExecuted).toBe(false);
    expect(decision.issues).toEqual([]);
  });

  it('keeps API route database binding separate from public lookup activation', () => {
    const decision = resolvePublicResultLookupPageDatabasePreflightDecision({
      env: buildApiRouteDatabaseBindingWithoutPublicLookupEnvironment(),
      context: 'public-result-lookup-page-preflight',
      acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
      acknowledgePublicLookupRemainsDisabled: true,
      acknowledgeNoPublicPageDatabaseRead: true
    });

    expect(decision.apiRouteBindingCanBeActiveWithoutPublicLookup).toBe(true);
    expect(decision.status).toBe('public-result-lookup-page-preflight-blocked');
    expect(decision.issues).toContain('public_lookup_database_activation_flag_required:unset');
    expect(decision.issues).toContain('public_lookup_page_database_preflight_flag_required:unset');
  });

  it('blocks direct public page context and rollback mode', () => {
    const pageContext = resolvePublicResultLookupPageDatabasePreflightDecision({
      env: buildCompletePublicResultLookupPageDatabasePreflightEnvironment(),
      context: 'public-result-page',
      acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
      acknowledgePublicLookupRemainsDisabled: true,
      acknowledgeNoPublicPageDatabaseRead: true
    });
    const rollback = resolvePublicResultLookupPageDatabasePreflightDecision({
      env: buildPublicResultLookupPageDatabasePreflightRollbackEnvironment(),
      context: 'public-result-lookup-page-preflight',
      acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
      acknowledgePublicLookupRemainsDisabled: true,
      acknowledgeNoPublicPageDatabaseRead: true
    });

    expect(pageContext.status).toBe('public-result-lookup-page-preflight-blocked');
    expect(pageContext.pageContextBlocked).toBe(true);
    expect(rollback.status).toBe('public-result-lookup-page-preflight-blocked');
    expect(rollback.rollbackToMemoryRequested).toBe(true);
  });

  it('exports the public lookup activation and preflight flag names', () => {
    expect(PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV).toBe('PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION');
    expect(PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV).toBe('PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT');
  });
});
