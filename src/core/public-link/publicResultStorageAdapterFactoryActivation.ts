import { buildCompleteDatabaseClientSmokeEnvironment } from './publicResultDatabaseClientSmokeBoundary';
import {
  PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE,
  PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION,
  createPublicResultDatabaseStorageAdapterImplementation,
  type PublicResultDatabaseQueryExecutor,
  type PublicResultDatabaseStorageAdapterImplementation
} from './publicResultDatabaseStorageAdapter';
import {
  PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_STORAGE_MODE_ENV,
  type PublicResultStorageRuntimeEnvironment
} from './publicResultStorageRuntimeSelection';
import {
  PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_PHASE,
  PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION,
  resolvePublicResultStorageAdapterFactoryDecision
} from './publicResultStorageAdapterFactory';

export const PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION =
  'phase-8.10-database-adapter-factory-activation-contract-v1' as const;
export const PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE =
  'phase-8.10-database-adapter-factory-activation-contract' as const;
export const PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_MODE =
  'explicit-non-route-factory-activation-no-route-binding' as const;

export const PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_ROUTE_BINDING_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PRODUCTION_MUTATION_ALLOWED = false as const;
export const PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_NETWORK_QUERY_ALLOWED = false as const;

export type PublicResultDatabaseAdapterFactoryActivationContext =
  | 'explicit-non-route-database-activation'
  | 'route-handler'
  | 'unspecified';

export type PublicResultDatabaseAdapterFactoryActivationStatus =
  | 'database-adapter-created-non-route-factory-context'
  | 'database-adapter-factory-activation-blocked';

export interface PublicResultDatabaseAdapterFactoryActivationOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicResultDatabaseAdapterFactoryActivationContext;
  readonly acknowledgeNoRouteBinding?: boolean;
  readonly executeQuery?: PublicResultDatabaseQueryExecutor;
  readonly nowIso?: () => string;
}

export interface PublicResultDatabaseAdapterFactoryActivationDecision {
  readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE;
  readonly mode: typeof PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_MODE;
  readonly baseFactorySchemaVersion: typeof PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION;
  readonly baseFactoryPhase: typeof PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_PHASE;
  readonly adapterImplementationSchemaVersion: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION;
  readonly adapterImplementationPhase: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE;
  readonly context: PublicResultDatabaseAdapterFactoryActivationContext;
  readonly requestedStorageMode: string | undefined;
  readonly requestedFactoryStatus: string;
  readonly requestedFactoryAdapterKind: string;
  readonly status: PublicResultDatabaseAdapterFactoryActivationStatus;
  readonly databaseAdapterCreated: boolean;
  readonly memoryAdapterCreated: false;
  readonly routeBindingAllowed: false;
  readonly routeHandlerBindingAllowed: false;
  readonly productionMutationSmokeAllowed: false;
  readonly networkQueryAllowed: false;
  readonly sqlExecutionAllowedByFactoryActivation: false;
  readonly explicitNonRouteContext: boolean;
  readonly noRouteBindingAcknowledged: boolean;
  readonly executeQueryProvided: boolean;
  readonly missingOrInvalidEnvFailsClosed: boolean;
  readonly publicResultStorageModeDatabaseRequired: boolean;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_RULES = [
  'factory-activation-requires-explicit-non-route-context',
  'public-result-storage-mode-database-alone-is-not-enough',
  'database-adapter-construction-requires-complete-database-env',
  'database-adapter-construction-requires-fake-or-injected-executor',
  'database-adapter-construction-requires-no-route-binding-acknowledgement',
  'route-handler-context-remains-blocked',
  'production-mutation-smoke-remains-blocked',
  'network-query-execution-remains-blocked',
  'public-api-routes-remain-memory-dry-run'
] as const;

export function resolvePublicResultDatabaseAdapterFactoryActivationDecision(
  options: PublicResultDatabaseAdapterFactoryActivationOptions = {}
): PublicResultDatabaseAdapterFactoryActivationDecision {
  const context = options.context ?? 'unspecified';
  const env = options.env ?? {};
  const baseFactoryDecision = resolvePublicResultStorageAdapterFactoryDecision({ env, purpose: 'contract-check' });
  const explicitNonRouteContext = context === 'explicit-non-route-database-activation';
  const noRouteBindingAcknowledged = options.acknowledgeNoRouteBinding === true;
  const executeQueryProvided = options.executeQuery !== undefined;
  const requestedStorageMode = env[PUBLIC_RESULT_STORAGE_MODE_ENV];

  const issues = [
    ...(requestedStorageMode === PUBLIC_RESULT_STORAGE_DATABASE_MODE
      ? []
      : [`database_storage_mode_required:${requestedStorageMode ?? 'unset'}`]),
    ...(baseFactoryDecision.status === 'database-factory-contract-only'
      ? []
      : [`base_factory_not_database_contract_only:${baseFactoryDecision.status}`]),
    ...(baseFactoryDecision.routeBindingAllowed ? ['base_factory_route_binding_allowed'] : []),
    ...(baseFactoryDecision.databaseAdapterCreated ? ['base_factory_created_database_adapter'] : []),
    ...(explicitNonRouteContext ? [] : [`explicit_non_route_context_required:${context}`]),
    ...(noRouteBindingAcknowledged ? [] : ['no_route_binding_acknowledgement_required']),
    ...(executeQueryProvided ? [] : ['database_query_executor_required']),
    ...(context === 'route-handler' ? ['route_handler_context_database_factory_activation_blocked'] : [])
  ];

  const allowed = issues.length === 0;

  return {
    schemaVersion: PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE,
    mode: PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_MODE,
    baseFactorySchemaVersion: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_SCHEMA_VERSION,
    baseFactoryPhase: PUBLIC_RESULT_STORAGE_ADAPTER_FACTORY_PHASE,
    adapterImplementationSchemaVersion: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_SCHEMA_VERSION,
    adapterImplementationPhase: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE,
    context,
    requestedStorageMode,
    requestedFactoryStatus: baseFactoryDecision.status,
    requestedFactoryAdapterKind: baseFactoryDecision.adapterKind,
    status: allowed
      ? 'database-adapter-created-non-route-factory-context'
      : 'database-adapter-factory-activation-blocked',
    databaseAdapterCreated: allowed,
    memoryAdapterCreated: false,
    routeBindingAllowed: false,
    routeHandlerBindingAllowed: false,
    productionMutationSmokeAllowed: false,
    networkQueryAllowed: false,
    sqlExecutionAllowedByFactoryActivation: false,
    explicitNonRouteContext,
    noRouteBindingAcknowledged,
    executeQueryProvided,
    missingOrInvalidEnvFailsClosed: baseFactoryDecision.failClosed && baseFactoryDecision.status !== 'memory-adapter-created',
    publicResultStorageModeDatabaseRequired: true,
    issues
  };
}

export function createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation(
  options: PublicResultDatabaseAdapterFactoryActivationOptions
): PublicResultDatabaseStorageAdapterImplementation {
  const decision = resolvePublicResultDatabaseAdapterFactoryActivationDecision(options);
  if (decision.status !== 'database-adapter-created-non-route-factory-context' || options.executeQuery === undefined) {
    throw new Error(`Database adapter factory activation failed closed: ${decision.issues.join(', ') || decision.status}`);
  }

  return createPublicResultDatabaseStorageAdapterImplementation({
    executeQuery: options.executeQuery,
    ...(options.nowIso === undefined ? {} : { nowIso: options.nowIso })
  });
}

export function buildCompleteDatabaseAdapterFactoryActivationEnvironment(): PublicResultStorageRuntimeEnvironment {
  return buildCompleteDatabaseClientSmokeEnvironment();
}

export function summarizePublicResultDatabaseAdapterFactoryActivationRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_PHASE}`,
    `schema:${PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_MODE}`,
    ...PUBLIC_RESULT_DATABASE_ADAPTER_FACTORY_ACTIVATION_RULES
  ];
}
