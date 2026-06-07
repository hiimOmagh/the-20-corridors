import { createInMemoryPublicResultStorageAdapter } from './inMemoryPublicResultStorage';
import {
  createPublicResultDatabaseQueryExecutorFromEnvironment,
  type PublicResultDatabaseClientSmokeEnvironment,
  resolvePublicResultDatabaseClientSmokeBoundary
} from './publicResultDatabaseClientSmokeBoundary';
import {
  createPublicResultDatabaseStorageAdapterImplementation,
  type PublicResultDatabaseQueryExecutor
} from './publicResultDatabaseStorageAdapter';
import type { PublicResultStorageAdapter } from './publicResultStorage';
import {
  PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_STORAGE_MEMORY_MODE,
  PUBLIC_RESULT_STORAGE_MODE_ENV,
  type PublicResultStorageRuntimeEnvironment
} from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_SCHEMA_VERSION =
  'phase-8.14-public-api-route-database-binding-implementation-gate-v1' as const;
export const PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_PHASE =
  'phase-8.14-public-api-route-database-binding-implementation-gate' as const;
export const PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_MODE =
  'api-route-database-binding-implemented-behind-explicit-gate' as const;

export const PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV =
  'PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION' as const;
export const PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED = 'enabled' as const;
export const PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV =
  'PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK' as const;
export const PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY = 'memory' as const;

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV =
  'PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED = 'enabled' as const;
export const PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV =
  'PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION' as const;
export const PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED = 'enabled' as const;

export type PublicResultApiRouteDatabaseBindingImplementationContext =
  | 'public-api-route-handler'
  | 'implementation-gate'
  | 'public-result-page-lookup'
  | 'unspecified';

export type PublicResultApiRouteDatabaseBindingImplementationStatus =
  | 'memory-adapter-selected-default'
  | 'memory-adapter-selected-rollback'
  | 'database-adapter-selected-for-public-api-route'
  | 'api-route-database-binding-implementation-blocked';

export interface PublicResultApiRouteDatabaseBindingImplementationEnvironment
  extends PublicResultStorageRuntimeEnvironment,
    PublicResultDatabaseClientSmokeEnvironment {}

export interface PublicResultApiRouteDatabaseBindingImplementationOptions {
  readonly env?: PublicResultApiRouteDatabaseBindingImplementationEnvironment;
  readonly context?: PublicResultApiRouteDatabaseBindingImplementationContext;
  readonly memoryAdapter?: PublicResultStorageAdapter;
  readonly executeQuery?: PublicResultDatabaseQueryExecutor;
  readonly nowIso?: () => string;
}

export interface PublicResultApiRouteDatabaseBindingImplementationDecision {
  readonly schemaVersion: typeof PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_PHASE;
  readonly mode: typeof PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_MODE;
  readonly context: PublicResultApiRouteDatabaseBindingImplementationContext;
  readonly status: PublicResultApiRouteDatabaseBindingImplementationStatus;
  readonly requestedStorageMode: string | undefined;
  readonly requestedActivationFlag: string | undefined;
  readonly requestedImplementationFlag: string | undefined;
  readonly requestedRollbackFlag: string | undefined;
  readonly requestedPublicLookupActivationFlag: string | undefined;
  readonly storageModeDatabase: boolean;
  readonly activationFlagEnabled: boolean;
  readonly implementationFlagEnabled: boolean;
  readonly rollbackToMemoryRequested: boolean;
  readonly publicLookupActivationFlagBlocked: boolean;
  readonly clientSmokeStatus: string;
  readonly databaseAdapterCreated: boolean;
  readonly memoryAdapterSelected: boolean;
  readonly routeBindingApplied: boolean;
  readonly publicApiRouteBindingApplied: boolean;
  readonly publicResultPageLookupActivationAllowed: false;
  readonly publicResultPageLookupSeparated: true;
  readonly networkQueryExecutedDuringSelection: false;
  readonly productionMutationSmokeAllowed: false;
  readonly rawDeleteTokenPersistenceAllowed: false;
  readonly rawAnswersExposureAllowed: false;
  readonly rollbackAvailable: true;
  readonly missingOrInvalidEnvFailsClosed: boolean;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_RULES = [
  'memory-adapter-remains-default-without-route-binding-flags',
  'database-route-binding-requires-public-result-storage-mode-database',
  'database-route-binding-requires-phase-8-13-activation-flag',
  'database-route-binding-requires-phase-8-14-implementation-flag',
  'database-route-binding-requires-complete-server-only-database-env',
  'database-route-binding-can-be-rolled-back-to-memory-immediately',
  'public-r-public-id-page-lookup-remains-separate-and-blocked',
  'route-selection-does-not-execute-network-sql',
  'no-production-mutation-smoke-is-run-by-the-gate',
  'delete-token-hash-only-storage-contract-remains-required',
  'raw-answers-remain-forbidden-in-public-route-payloads'
] as const;

export function resolvePublicResultApiRouteDatabaseBindingImplementationDecision(
  options: PublicResultApiRouteDatabaseBindingImplementationOptions = {}
): PublicResultApiRouteDatabaseBindingImplementationDecision {
  const env = options.env ?? process.env;
  const context = options.context ?? 'unspecified';
  const requestedStorageMode = env[PUBLIC_RESULT_STORAGE_MODE_ENV];
  const requestedActivationFlag = env[PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV];
  const requestedImplementationFlag = env[PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV];
  const requestedRollbackFlag = env[PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV];
  const requestedPublicLookupActivationFlag = env[PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV];

  const storageModeDatabase = requestedStorageMode === PUBLIC_RESULT_STORAGE_DATABASE_MODE;
  const storageModeMemory = requestedStorageMode === PUBLIC_RESULT_STORAGE_MEMORY_MODE || requestedStorageMode === undefined;
  const activationFlagEnabled = requestedActivationFlag === PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED;
  const implementationFlagEnabled = requestedImplementationFlag === PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED;
  const rollbackToMemoryRequested = requestedRollbackFlag === PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY;
  const publicLookupActivationFlagBlocked = requestedPublicLookupActivationFlag === PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED;
  const anyDatabaseActivationSignal = storageModeDatabase || activationFlagEnabled || implementationFlagEnabled;
  const clientSmoke = resolvePublicResultDatabaseClientSmokeBoundary(env);

  if (rollbackToMemoryRequested) {
    return buildDecision({
      env,
      context,
      status: 'memory-adapter-selected-rollback',
      clientSmokeStatus: clientSmoke.status,
      issues: [],
      storageModeDatabase,
      activationFlagEnabled,
      implementationFlagEnabled,
      rollbackToMemoryRequested,
      publicLookupActivationFlagBlocked,
      requestedStorageMode,
      requestedActivationFlag,
      requestedImplementationFlag,
      requestedRollbackFlag,
      requestedPublicLookupActivationFlag
    });
  }

  if (!anyDatabaseActivationSignal && storageModeMemory) {
    return buildDecision({
      env,
      context,
      status: 'memory-adapter-selected-default',
      clientSmokeStatus: clientSmoke.status,
      issues: [],
      storageModeDatabase,
      activationFlagEnabled,
      implementationFlagEnabled,
      rollbackToMemoryRequested,
      publicLookupActivationFlagBlocked,
      requestedStorageMode,
      requestedActivationFlag,
      requestedImplementationFlag,
      requestedRollbackFlag,
      requestedPublicLookupActivationFlag
    });
  }

  const issues = [
    ...(context === 'public-api-route-handler' || context === 'implementation-gate'
      ? []
      : [`public_api_route_handler_context_required:${context}`]),
    ...(storageModeDatabase ? [] : [`database_storage_mode_required:${requestedStorageMode ?? 'unset'}`]),
    ...(activationFlagEnabled ? [] : [`route_database_binding_activation_flag_required:${requestedActivationFlag ?? 'unset'}`]),
    ...(implementationFlagEnabled ? [] : [`api_route_database_binding_implementation_flag_required:${requestedImplementationFlag ?? 'unset'}`]),
    ...(clientSmoke.status === 'client-created-smoke-only' ? [] : [`database_client_smoke_required:${clientSmoke.status}`]),
    ...(publicLookupActivationFlagBlocked ? ['public_lookup_database_activation_flag_blocked_in_api_route_binding_phase'] : [])
  ];

  return buildDecision({
    env,
    context,
    status: issues.length === 0
      ? 'database-adapter-selected-for-public-api-route'
      : 'api-route-database-binding-implementation-blocked',
    clientSmokeStatus: clientSmoke.status,
    issues,
    storageModeDatabase,
    activationFlagEnabled,
    implementationFlagEnabled,
    rollbackToMemoryRequested,
    publicLookupActivationFlagBlocked,
    requestedStorageMode,
    requestedActivationFlag,
    requestedImplementationFlag,
    requestedRollbackFlag,
    requestedPublicLookupActivationFlag
  });
}

export function createPublicResultApiRouteDatabaseBindingStorageAdapter(
  options: PublicResultApiRouteDatabaseBindingImplementationOptions = {}
): PublicResultStorageAdapter {
  const decision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision(options);
  const memoryAdapter = options.memoryAdapter ?? createInMemoryPublicResultStorageAdapter();

  if (decision.status === 'memory-adapter-selected-default' || decision.status === 'memory-adapter-selected-rollback') {
    return memoryAdapter;
  }

  if (decision.status !== 'database-adapter-selected-for-public-api-route') {
    throw new Error(`Public API route database binding failed closed: ${decision.issues.join(', ') || decision.status}`);
  }

  const executeQuery = options.executeQuery ?? createPublicResultDatabaseQueryExecutorFromEnvironment(options.env ?? process.env);
  return createPublicResultDatabaseStorageAdapterImplementation({
    executeQuery,
    ...(options.nowIso === undefined ? {} : { nowIso: options.nowIso })
  });
}

export function buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment(): PublicResultApiRouteDatabaseBindingImplementationEnvironment {
  return {
    [PUBLIC_RESULT_STORAGE_MODE_ENV]: PUBLIC_RESULT_STORAGE_DATABASE_MODE,
    [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV]: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED,
    [PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV]: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED,
    PUBLIC_RESULT_DATABASE_URL: 'postgresql://contract_user:contract_password@example.invalid/the_20_corridors?sslmode=require',
    PUBLIC_RESULT_DATABASE_PROVIDER: 'postgresql',
    PUBLIC_RESULT_DATABASE_SCHEMA_VERSION: 'public-result-database-record-v1',
    PUBLIC_RESULT_DATABASE_SERVICE_KEY: 'contract-only-service-key-placeholder'
  };
}

export function buildPublicResultApiRouteDatabaseBindingRollbackEnvironment(): PublicResultApiRouteDatabaseBindingImplementationEnvironment {
  return {
    ...buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment(),
    [PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV]: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY
  };
}

export function summarizePublicResultApiRouteDatabaseBindingImplementationRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_PHASE}`,
    `schema:${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_MODE}`,
    `flag:${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV}=${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED}`,
    `rollback:${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV}=${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY}`,
    ...PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_RULES
  ];
}

function buildDecision(input: {
  readonly env: PublicResultStorageRuntimeEnvironment;
  readonly context: PublicResultApiRouteDatabaseBindingImplementationContext;
  readonly status: PublicResultApiRouteDatabaseBindingImplementationStatus;
  readonly clientSmokeStatus: string;
  readonly issues: readonly string[];
  readonly storageModeDatabase: boolean;
  readonly activationFlagEnabled: boolean;
  readonly implementationFlagEnabled: boolean;
  readonly rollbackToMemoryRequested: boolean;
  readonly publicLookupActivationFlagBlocked: boolean;
  readonly requestedStorageMode: string | undefined;
  readonly requestedActivationFlag: string | undefined;
  readonly requestedImplementationFlag: string | undefined;
  readonly requestedRollbackFlag: string | undefined;
  readonly requestedPublicLookupActivationFlag: string | undefined;
}): PublicResultApiRouteDatabaseBindingImplementationDecision {
  const databaseAdapterCreated = input.status === 'database-adapter-selected-for-public-api-route';
  const memoryAdapterSelected = input.status === 'memory-adapter-selected-default' || input.status === 'memory-adapter-selected-rollback';
  return {
    schemaVersion: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_PHASE,
    mode: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_MODE,
    context: input.context,
    status: input.status,
    requestedStorageMode: input.requestedStorageMode,
    requestedActivationFlag: input.requestedActivationFlag,
    requestedImplementationFlag: input.requestedImplementationFlag,
    requestedRollbackFlag: input.requestedRollbackFlag,
    requestedPublicLookupActivationFlag: input.requestedPublicLookupActivationFlag,
    storageModeDatabase: input.storageModeDatabase,
    activationFlagEnabled: input.activationFlagEnabled,
    implementationFlagEnabled: input.implementationFlagEnabled,
    rollbackToMemoryRequested: input.rollbackToMemoryRequested,
    publicLookupActivationFlagBlocked: input.publicLookupActivationFlagBlocked,
    clientSmokeStatus: input.clientSmokeStatus,
    databaseAdapterCreated,
    memoryAdapterSelected,
    routeBindingApplied: databaseAdapterCreated,
    publicApiRouteBindingApplied: databaseAdapterCreated,
    publicResultPageLookupActivationAllowed: false,
    publicResultPageLookupSeparated: true,
    networkQueryExecutedDuringSelection: false,
    productionMutationSmokeAllowed: false,
    rawDeleteTokenPersistenceAllowed: false,
    rawAnswersExposureAllowed: false,
    rollbackAvailable: true,
    missingOrInvalidEnvFailsClosed: input.issues.length > 0 || memoryAdapterSelected,
    issues: input.issues
  };
}
