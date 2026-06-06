import { describe, expect, it } from 'vitest';
import {
  buildCompleteDatabaseAdapterFactoryActivationEnvironment,
  createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation,
  PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_MODE,
  PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION,
  resolvePublicResultDatabaseAdapterFactoryActivationDecision,
  summarizePublicResultDatabaseAdapterFactoryActivationRules
} from '../../src/core/public-link/publicResultStorageAdapterFactoryActivation';
import type { PublicResultDatabaseQueryExecutor } from '../../src/core/public-link/publicResultDatabaseStorageAdapter';

const executeQuery: PublicResultDatabaseQueryExecutor = async () => ({ rows: [], rowCount: 0 });

describe('public result storage adapter factory activation', () => {
  it('creates the database adapter only for explicit non-route activation context', () => {
    const decision = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
      env: buildCompleteDatabaseAdapterFactoryActivationEnvironment(),
      context: 'explicit-non-route-database-activation',
      acknowledgeNoRouteBinding: true,
      executeQuery
    });

    expect(decision).toMatchObject({
      schemaVersion: PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION,
      mode: PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_MODE,
      status: 'database-adapter-created-non-route-factory-context',
      requestedFactoryStatus: 'database-factory-contract-only',
      databaseAdapterCreated: true,
      routeBindingAllowed: false,
      routeHandlerBindingAllowed: false,
      productionMutationSmokeAllowed: false,
      networkQueryAllowed: false,
      sqlExecutionAllowedByFactoryActivation: false,
      explicitNonRouteContext: true,
      noRouteBindingAcknowledged: true,
      executeQueryProvided: true,
      issues: []
    });

    const adapter = createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation({
      env: buildCompleteDatabaseAdapterFactoryActivationEnvironment(),
      context: 'explicit-non-route-database-activation',
      acknowledgeNoRouteBinding: true,
      executeQuery
    });
    expect(adapter.adapterKind).toBe('server-only-public-result-database-adapter');
    expect(adapter.diagnostics()).toMatchObject({ routeBindingAllowed: false, factoryBindingAllowed: false });
  });

  it('blocks database mode alone and route-handler context', () => {
    const databaseModeAlone = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
      env: buildCompleteDatabaseAdapterFactoryActivationEnvironment()
    });
    const routeHandlerContext = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
      env: buildCompleteDatabaseAdapterFactoryActivationEnvironment(),
      context: 'route-handler',
      acknowledgeNoRouteBinding: true,
      executeQuery
    });

    expect(databaseModeAlone).toMatchObject({
      status: 'database-adapter-factory-activation-blocked',
      databaseAdapterCreated: false,
      routeBindingAllowed: false
    });
    expect(databaseModeAlone.issues).toContain('explicit_non_route_context_required:unspecified');
    expect(databaseModeAlone.issues).toContain('no_route_binding_acknowledgement_required');
    expect(routeHandlerContext).toMatchObject({
      status: 'database-adapter-factory-activation-blocked',
      databaseAdapterCreated: false,
      routeHandlerBindingAllowed: false
    });
    expect(routeHandlerContext.issues).toContain('route_handler_context_database_factory_activation_blocked');
    expect(() =>
      createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation({
        env: buildCompleteDatabaseAdapterFactoryActivationEnvironment(),
        context: 'route-handler',
        acknowledgeNoRouteBinding: true,
        executeQuery
      })
    ).toThrow(/failed closed/i);
  });

  it('fails closed for missing database env and missing executor', () => {
    const missingEnv = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
      env: { PUBLIC_RESULT_STORAGE_MODE: 'database' },
      context: 'explicit-non-route-database-activation',
      acknowledgeNoRouteBinding: true,
      executeQuery
    });
    const missingExecutor = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
      env: buildCompleteDatabaseAdapterFactoryActivationEnvironment(),
      context: 'explicit-non-route-database-activation',
      acknowledgeNoRouteBinding: true
    });

    expect(missingEnv).toMatchObject({ status: 'database-adapter-factory-activation-blocked', databaseAdapterCreated: false });
    expect(missingEnv.issues).toContain('base_factory_not_database_contract_only:factory-blocked');
    expect(missingExecutor).toMatchObject({ status: 'database-adapter-factory-activation-blocked', databaseAdapterCreated: false });
    expect(missingExecutor.issues).toContain('database_query_executor_required');
  });

  it('summarizes activation rules for release evidence', () => {
    expect(summarizePublicResultDatabaseAdapterFactoryActivationRules()).toEqual(
      expect.arrayContaining([
        'phase:phase-8.10-database-adapter-factory-activation-contract',
        `schema:${PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION}`,
        `mode:${PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_MODE}`,
        'factory-activation-requires-explicit-non-route-context',
        'route-handler-context-remains-blocked'
      ])
    );
  });
});
