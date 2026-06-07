import { describe, expect, it } from 'vitest';
import {
  buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_MODE,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION,
  resolvePublicResultRouteDatabaseBindingPreflightDecision,
  summarizePublicResultRouteDatabaseBindingPreflightRules
} from '../../src/core/public-link/publicResultRouteDatabaseBindingPreflight';

describe('public result route database binding preflight', () => {
  it('marks route binding preflight ready but still disabled when every explicit criterion is present', () => {
    const decision = resolvePublicResultRouteDatabaseBindingPreflightDecision({
      env: buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment(),
      context: 'preflight-contract',
      acknowledgeNoProductionRouteBinding: true
    });

    expect(decision).toMatchObject({
      schemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION,
      mode: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_MODE,
      status: 'route-database-binding-preflight-ready-but-disabled',
      preflightReady: true,
      completeDatabaseEnvPresent: true,
      databaseStorageModeRequested: true,
      explicitRouteBindingPreflightFlagPresent: true,
      acknowledgeNoProductionRouteBinding: true,
      databaseAdapterCanBeCreatedInNonRouteContext: true,
      databaseModeAloneInsufficient: true,
      routeBindingAllowed: false,
      routeHandlerBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryAllowed: false,
      persistentPublicLookupAllowed: false,
      publicApiRoutesRemainMemoryDryRun: true,
      issues: []
    });
  });

  it('blocks database mode alone, missing flag, and route-handler context', () => {
    const completeEnv = buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment();
    const databaseModeAlone = resolvePublicResultRouteDatabaseBindingPreflightDecision({ env: completeEnv });
    const { [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV]: _removed, ...missingFlagEnv } = completeEnv;
    const missingFlag = resolvePublicResultRouteDatabaseBindingPreflightDecision({
      env: missingFlagEnv,
      context: 'preflight-contract',
      acknowledgeNoProductionRouteBinding: true
    });
    const routeHandlerContext = resolvePublicResultRouteDatabaseBindingPreflightDecision({
      env: completeEnv,
      context: 'public-api-route-handler',
      acknowledgeNoProductionRouteBinding: true
    });

    expect(databaseModeAlone).toMatchObject({
      status: 'route-database-binding-preflight-blocked',
      preflightReady: false,
      routeBindingAllowed: false
    });
    expect(databaseModeAlone.issues).toContain('preflight_contract_context_required:unspecified');
    expect(databaseModeAlone.issues).toContain('no_production_route_binding_acknowledgement_required');

    expect(missingFlag).toMatchObject({
      status: 'route-database-binding-preflight-blocked',
      preflightReady: false,
      explicitRouteBindingPreflightFlagPresent: false
    });
    expect(missingFlag.issues).toContain('route_binding_preflight_flag_required:unset');

    expect(routeHandlerContext).toMatchObject({
      status: 'route-database-binding-preflight-blocked',
      preflightReady: false,
      routeHandlerContextBlocked: true,
      routeHandlerBindingAllowed: false
    });
    expect(routeHandlerContext.issues).toContain('public_api_route_handler_context_database_binding_blocked');
  });

  it('requires complete database env and summarizes the flag contract', () => {
    const missingEnv = resolvePublicResultRouteDatabaseBindingPreflightDecision({
      env: {
        PUBLIC_RESULT_STORAGE_MODE: 'database',
        [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV]: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED
      },
      context: 'preflight-contract',
      acknowledgeNoProductionRouteBinding: true
    });

    expect(missingEnv).toMatchObject({
      status: 'route-database-binding-preflight-blocked',
      completeDatabaseEnvPresent: false,
      routeBindingAllowed: false
    });
    expect(missingEnv.issues).toEqual(expect.arrayContaining([expect.stringMatching(/^complete_database_env_required:/)]));
    expect(summarizePublicResultRouteDatabaseBindingPreflightRules()).toEqual(
      expect.arrayContaining([
        'phase:phase-8.11-public-route-database-binding-preflight-contract',
        `schema:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION}`,
        `flag:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV}=${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED}`,
        'explicit-route-binding-preflight-flag-is-required',
        'preflight-readiness-does-not-activate-production-routes'
      ])
    );
  });
});
