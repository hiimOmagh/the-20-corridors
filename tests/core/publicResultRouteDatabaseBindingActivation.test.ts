import { describe, expect, it } from 'vitest';
import {
  buildCompletePublicResultRouteDatabaseBindingActivationEnvironment,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_MODE,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION,
  resolvePublicResultRouteDatabaseBindingActivationDecision,
  summarizePublicResultRouteDatabaseBindingActivationRules
} from '../../src/core/public-link/publicResultRouteDatabaseBindingActivation';

describe('public result route database binding activation decision', () => {
  it('marks API route database binding ready without applying route persistence', async () => {
    const decision = await resolvePublicResultRouteDatabaseBindingActivationDecision({
      env: buildCompletePublicResultRouteDatabaseBindingActivationEnvironment(),
      context: 'route-binding-activation-contract',
      acknowledgeApiRouteOnlyActivation: true,
      acknowledgeActualRouteHandlersRemainUnchanged: true
    });

    expect(decision).toMatchObject({
      schemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION,
      mode: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_MODE,
      status: 'api-route-database-binding-activation-ready-not-applied',
      activationFlagPresent: true,
      dryRunPassed: true,
      fakeRouteBoundAdapterCreatedInDryRun: true,
      routeFlowSimulationPassed: true,
      apiRouteDatabaseBindingActivationReady: true,
      actualRouteHandlersRemainMemoryDryRun: true,
      actualRouteBindingApplied: false,
      publicApiRoutesRemainMemoryDryRun: true,
      publicResultPageLookupActivationAllowed: false,
      publicResultPageLookupActivationSeparated: true,
      productionMutationSmokeAllowed: false,
      networkQueryExecuted: false,
      persistentPublicLookupAllowed: false,
      issues: []
    });
  });

  it('blocks missing activation flag, missing acknowledgement, route-handler context, and public lookup activation', async () => {
    const completeEnv = buildCompletePublicResultRouteDatabaseBindingActivationEnvironment();
    const { [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV]: _removed, ...missingActivationFlagEnv } = completeEnv;

    const missingFlag = await resolvePublicResultRouteDatabaseBindingActivationDecision({
      env: missingActivationFlagEnv,
      context: 'route-binding-activation-contract',
      acknowledgeApiRouteOnlyActivation: true,
      acknowledgeActualRouteHandlersRemainUnchanged: true
    });
    const missingAcknowledgement = await resolvePublicResultRouteDatabaseBindingActivationDecision({
      env: completeEnv,
      context: 'route-binding-activation-contract',
      acknowledgeActualRouteHandlersRemainUnchanged: true
    });
    const routeHandlerContext = await resolvePublicResultRouteDatabaseBindingActivationDecision({
      env: completeEnv,
      context: 'public-api-route-handler',
      acknowledgeApiRouteOnlyActivation: true,
      acknowledgeActualRouteHandlersRemainUnchanged: true
    });
    const publicLookupContext = await resolvePublicResultRouteDatabaseBindingActivationDecision({
      env: completeEnv,
      context: 'public-result-page-lookup',
      acknowledgeApiRouteOnlyActivation: true,
      acknowledgeActualRouteHandlersRemainUnchanged: true
    });
    const publicLookupFlagEnabled = await resolvePublicResultRouteDatabaseBindingActivationDecision({
      env: { ...completeEnv, [PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV]: 'enabled' },
      context: 'route-binding-activation-contract',
      acknowledgeApiRouteOnlyActivation: true,
      acknowledgeActualRouteHandlersRemainUnchanged: true
    });

    expect(missingFlag.status).toBe('api-route-database-binding-activation-blocked');
    expect(missingFlag.issues).toContain('route_database_binding_activation_flag_required:unset');

    expect(missingAcknowledgement.status).toBe('api-route-database-binding-activation-blocked');
    expect(missingAcknowledgement.issues).toContain('api_route_only_activation_acknowledgement_required');

    expect(routeHandlerContext).toMatchObject({
      status: 'api-route-database-binding-activation-blocked',
      routeHandlerContextBlocked: true,
      actualRouteBindingApplied: false
    });
    expect(routeHandlerContext.issues).toContain('public_api_route_handler_context_activation_blocked_until_implementation_phase');

    expect(publicLookupContext).toMatchObject({
      status: 'api-route-database-binding-activation-blocked',
      publicLookupContextBlocked: true,
      publicResultPageLookupActivationAllowed: false
    });
    expect(publicLookupContext.issues).toContain('public_result_page_lookup_context_activation_blocked');

    expect(publicLookupFlagEnabled).toMatchObject({
      status: 'api-route-database-binding-activation-blocked',
      publicLookupActivationFlagBlocked: true,
      publicResultPageLookupActivationAllowed: false
    });
    expect(publicLookupFlagEnabled.issues).toContain('public_result_page_lookup_activation_flag_blocked_in_phase_8_13');
  });

  it('summarizes the Phase 8.13 activation flag and separation rules', () => {
    expect(summarizePublicResultRouteDatabaseBindingActivationRules()).toEqual(
      expect.arrayContaining([
        'phase:phase-8.13-public-route-database-binding-activation-contract',
        `schema:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION}`,
        `flag:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV}=${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED}`,
        `separate_page_lookup_flag:${PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV}`,
        'api-route-activation-decision-is-not-implementation',
        'actual-public-route-handler-resolver-remains-memory-dry-run',
        'public-r-public-id-page-lookup-activation-is-separate-and-blocked'
      ])
    );
  });
});
