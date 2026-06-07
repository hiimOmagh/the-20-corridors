import { describe, expect, it } from 'vitest';
import {
  buildCompletePublicResultLookupPageDatabaseActivationEnvironment,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION,
  resolvePublicResultLookupPageDatabaseActivationDecision
} from '../../src/core/public-link/publicResultLookupPageDatabaseActivation';

const ACKS = {
  acknowledgeActivationDecisionOnly: true,
  acknowledgeNoRealPageDatabaseRead: true,
  acknowledgePageRouteImplementationSeparate: true,
  acknowledgeRollbackBlocksLookupActivation: true
} as const;

describe('public result lookup page database activation decision', () => {
  it('reaches ready-not-applied only for explicit activation contract context', async () => {
    const decision = await resolvePublicResultLookupPageDatabaseActivationDecision({
      env: buildCompletePublicResultLookupPageDatabaseActivationEnvironment(),
      context: 'public-result-lookup-page-activation-contract',
      ...ACKS
    });

    expect(decision.schemaVersion).toBe(PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION);
    expect(decision.phase).toBe(PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE);
    expect(decision.status).toBe('public-result-lookup-page-activation-ready-not-applied');
    expect(decision.activationDecisionReady).toBe(true);
    expect(decision.completeDatabaseEnvPresent).toBe(true);
    expect(decision.apiRouteDatabaseBindingGateValid).toBe(true);
    expect(decision.dryRunStatus).toMatchObject({
      status: 'public-result-lookup-page-dry-run-passed',
      lookupSimulationPassed: true,
      activeLookupHttpStatus: 200,
      readMissHttpStatus: 404,
      deletedLookupHttpStatus: 410,
      expiredLookupHttpStatus: 410
    });
    expect(decision.actualPublicLookupPageBindingApplied).toBe(false);
    expect(decision.publicPageDatabaseReadAllowed).toBe(false);
    expect(decision.realPublicResultPageDatabaseReadExecuted).toBe(false);
    expect(decision.networkLookupExecuted).toBe(false);
    expect(decision.publicPageRouteImplementationAllowed).toBe(false);
    expect(decision.issues).toEqual([]);
  });

  it('blocks activation when the public lookup activation flag is missing', async () => {
    const { PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION: _removed, ...env } =
      buildCompletePublicResultLookupPageDatabaseActivationEnvironment();

    const decision = await resolvePublicResultLookupPageDatabaseActivationDecision({
      env,
      context: 'public-result-lookup-page-activation-contract',
      ...ACKS
    });

    expect(decision.status).toBe('public-result-lookup-page-activation-blocked');
    expect(decision.publicLookupActivationFlagPresent).toBe(false);
    expect(decision.issues).toContain('public_lookup_database_activation_flag_required:unset');
  });

  it('blocks activation when rollback to memory is requested', async () => {
    const decision = await resolvePublicResultLookupPageDatabaseActivationDecision({
      env: {
        ...buildCompletePublicResultLookupPageDatabaseActivationEnvironment(),
        PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK: 'memory'
      },
      context: 'public-result-lookup-page-activation-contract',
      ...ACKS
    });

    expect(decision.status).toBe('public-result-lookup-page-activation-blocked');
    expect(decision.rollbackToMemoryRequested).toBe(true);
    expect(decision.publicLookupActivationDoesNotBypassRollback).toBe(false);
    expect(decision.issues).toContain('rollback_to_memory_blocks_public_lookup_activation');
  });

  it('blocks real public page context until the implementation gate', async () => {
    const decision = await resolvePublicResultLookupPageDatabaseActivationDecision({
      env: buildCompletePublicResultLookupPageDatabaseActivationEnvironment(),
      context: 'public-result-page',
      ...ACKS
    });

    expect(decision.status).toBe('public-result-lookup-page-activation-blocked');
    expect(decision.pageContextBlocked).toBe(true);
    expect(decision.issues).toContain('public_result_lookup_page_activation_context_required:public-result-page');
    expect(decision.issues).toContain('public_result_page_context_blocked_until_page_implementation_gate');
  });
});
