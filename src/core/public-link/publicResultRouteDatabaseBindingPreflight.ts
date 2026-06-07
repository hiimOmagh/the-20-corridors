import {
  buildCompleteDatabaseAdapterFactoryActivationEnvironment,
  PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE,
  PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION,
  resolvePublicResultDatabaseAdapterFactoryActivationDecision
} from './publicResultStorageAdapterFactoryActivation';
import {
  PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_STORAGE_MODE_ENV,
  type PublicResultStorageRuntimeEnvironment
} from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION =
  'phase-8.11-public-route-database-binding-preflight-contract-v1' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE =
  'phase-8.11-public-route-database-binding-preflight-contract' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_MODE =
  'route-database-binding-preflight-ready-but-disabled' as const;

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV = 'PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED = 'enabled' as const;

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ALLOWED = false as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_PRODUCTION_MUTATION_SMOKE_ALLOWED = false as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_NETWORK_QUERY_ALLOWED = false as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_PERSISTENT_LOOKUP_ALLOWED = false as const;

export type PublicResultRouteDatabaseBindingPreflightContext =
  | 'preflight-contract'
  | 'public-api-route-handler'
  | 'unspecified';

export type PublicResultRouteDatabaseBindingPreflightStatus =
  | 'route-database-binding-preflight-ready-but-disabled'
  | 'route-database-binding-preflight-blocked';

export interface PublicResultRouteDatabaseBindingPreflightOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicResultRouteDatabaseBindingPreflightContext;
  readonly acknowledgeNoProductionRouteBinding?: boolean;
}

export interface PublicResultRouteDatabaseBindingPreflightDecision {
  readonly schemaVersion: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE;
  readonly mode: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_MODE;
  readonly factoryActivationSchemaVersion: typeof PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION;
  readonly factoryActivationPhase: typeof PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE;
  readonly context: PublicResultRouteDatabaseBindingPreflightContext;
  readonly requestedStorageMode: string | undefined;
  readonly requestedRouteBindingPreflightFlag: string | undefined;
  readonly factoryActivationStatus: string;
  readonly status: PublicResultRouteDatabaseBindingPreflightStatus;
  readonly preflightReady: boolean;
  readonly completeDatabaseEnvPresent: boolean;
  readonly databaseStorageModeRequested: boolean;
  readonly explicitRouteBindingPreflightFlagPresent: boolean;
  readonly acknowledgeNoProductionRouteBinding: boolean;
  readonly routeHandlerContextBlocked: boolean;
  readonly databaseAdapterCanBeCreatedInNonRouteContext: boolean;
  readonly databaseModeAloneInsufficient: true;
  readonly routeBindingAllowed: false;
  readonly routeHandlerBindingAllowed: false;
  readonly productionMutationSmokeAllowed: false;
  readonly networkQueryAllowed: false;
  readonly persistentPublicLookupAllowed: false;
  readonly publicApiRoutesRemainMemoryDryRun: true;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_RULES = [
  'public-result-storage-mode-database-alone-is-insufficient-for-route-binding',
  'explicit-route-binding-preflight-flag-is-required',
  'complete-database-env-is-required',
  'factory-activation-contract-must-be-green',
  'public-api-route-handler-context-remains-blocked',
  'preflight-readiness-does-not-activate-production-routes',
  'production-mutation-smoke-remains-blocked',
  'network-query-execution-remains-blocked',
  'persistent-public-result-lookup-remains-blocked',
  'public-api-routes-remain-memory-dry-run'
] as const;

export function resolvePublicResultRouteDatabaseBindingPreflightDecision(
  options: PublicResultRouteDatabaseBindingPreflightOptions = {}
): PublicResultRouteDatabaseBindingPreflightDecision {
  const env = options.env ?? {};
  const context = options.context ?? 'unspecified';
  const requestedStorageMode = env[PUBLIC_RESULT_STORAGE_MODE_ENV];
  const requestedRouteBindingPreflightFlag = env[PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV];
  const databaseStorageModeRequested = requestedStorageMode === PUBLIC_RESULT_STORAGE_DATABASE_MODE;
  const explicitRouteBindingPreflightFlagPresent =
    requestedRouteBindingPreflightFlag === PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED;
  const acknowledgeNoProductionRouteBinding = options.acknowledgeNoProductionRouteBinding === true;
  const routeHandlerContextBlocked = context === 'public-api-route-handler';

  const factoryActivationDecision = resolvePublicResultDatabaseAdapterFactoryActivationDecision({
    env,
    context: 'explicit-non-route-database-activation',
    acknowledgeNoRouteBinding: true,
    executeQuery: async () => ({ rows: [], rowCount: 0 })
  });
  const completeDatabaseEnvPresent = factoryActivationDecision.status === 'database-adapter-created-non-route-factory-context';

  const issues = [
    ...(databaseStorageModeRequested ? [] : [`database_storage_mode_required:${requestedStorageMode ?? 'unset'}`]),
    ...(explicitRouteBindingPreflightFlagPresent
      ? []
      : [`route_binding_preflight_flag_required:${requestedRouteBindingPreflightFlag ?? 'unset'}`]),
    ...(completeDatabaseEnvPresent ? [] : [`complete_database_env_required:${factoryActivationDecision.status}`]),
    ...(acknowledgeNoProductionRouteBinding ? [] : ['no_production_route_binding_acknowledgement_required']),
    ...(context === 'preflight-contract' ? [] : [`preflight_contract_context_required:${context}`]),
    ...(routeHandlerContextBlocked ? ['public_api_route_handler_context_database_binding_blocked'] : [])
  ];

  const preflightReady = issues.length === 0;

  return {
    schemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE,
    mode: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_MODE,
    factoryActivationSchemaVersion: PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION,
    factoryActivationPhase: PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE,
    context,
    requestedStorageMode,
    requestedRouteBindingPreflightFlag,
    factoryActivationStatus: factoryActivationDecision.status,
    status: preflightReady
      ? 'route-database-binding-preflight-ready-but-disabled'
      : 'route-database-binding-preflight-blocked',
    preflightReady,
    completeDatabaseEnvPresent,
    databaseStorageModeRequested,
    explicitRouteBindingPreflightFlagPresent,
    acknowledgeNoProductionRouteBinding,
    routeHandlerContextBlocked,
    databaseAdapterCanBeCreatedInNonRouteContext: completeDatabaseEnvPresent,
    databaseModeAloneInsufficient: true,
    routeBindingAllowed: false,
    routeHandlerBindingAllowed: false,
    productionMutationSmokeAllowed: false,
    networkQueryAllowed: false,
    persistentPublicLookupAllowed: false,
    publicApiRoutesRemainMemoryDryRun: true,
    issues
  };
}

export function buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment(): PublicResultStorageRuntimeEnvironment {
  return {
    ...buildCompleteDatabaseAdapterFactoryActivationEnvironment(),
    [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV]: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED
  };
}

export function summarizePublicResultRouteDatabaseBindingPreflightRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE}`,
    `schema:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_MODE}`,
    `flag:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENV}=${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_ENABLED}`,
    ...PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_RULES
  ];
}
