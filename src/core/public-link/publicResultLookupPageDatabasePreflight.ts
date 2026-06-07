import {
  buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED,
  resolvePublicResultApiRouteDatabaseBindingImplementationDecision,
  type PublicResultApiRouteDatabaseBindingImplementationEnvironment
} from './publicResultApiRouteDatabaseBindingImplementation';

export { PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV, PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED };
import {
  PUBLIC_RESULT_STORAGE_DATABASE_MODE,
  PUBLIC_RESULT_STORAGE_MODE_ENV,
  type PublicResultStorageRuntimeEnvironment
} from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION =
  'phase-8.16-public-result-lookup-page-preflight-contract-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE =
  'phase-8.16-public-result-lookup-page-preflight-contract' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_MODE =
  'public-result-lookup-page-preflight-ready-but-disabled' as const;

export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV = 'PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED = 'enabled' as const;

export type PublicResultLookupPageDatabasePreflightContext =
  | 'public-result-lookup-page-preflight'
  | 'public-result-page'
  | 'public-api-route-handler'
  | 'unspecified';

export type PublicResultLookupPageDatabasePreflightStatus =
  | 'public-result-lookup-page-preflight-ready-but-disabled'
  | 'public-result-lookup-page-preflight-blocked';

export interface PublicResultLookupPageDatabasePreflightEnvironment
  extends PublicResultApiRouteDatabaseBindingImplementationEnvironment {}

export interface PublicResultLookupPageDatabasePreflightOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicResultLookupPageDatabasePreflightContext;
  readonly acknowledgeApiRouteBindingDoesNotActivatePublicLookup?: boolean;
  readonly acknowledgePublicLookupRemainsDisabled?: boolean;
  readonly acknowledgeNoPublicPageDatabaseRead?: boolean;
}

export interface PublicResultLookupPageDatabasePreflightDecision {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE;
  readonly mode: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_MODE;
  readonly context: PublicResultLookupPageDatabasePreflightContext;
  readonly status: PublicResultLookupPageDatabasePreflightStatus;
  readonly requestedStorageMode: string | undefined;
  readonly requestedApiRouteBindingImplementationFlag: string | undefined;
  readonly requestedRollbackFlag: string | undefined;
  readonly requestedPublicLookupActivationFlag: string | undefined;
  readonly requestedPublicLookupPreflightFlag: string | undefined;
  readonly databaseStorageModeRequested: boolean;
  readonly apiRouteBindingImplementationFlagPresent: boolean;
  readonly publicLookupActivationFlagPresent: boolean;
  readonly publicLookupPreflightFlagPresent: boolean;
  readonly completeDatabaseEnvPresent: boolean;
  readonly apiRouteBindingDecisionStatus: string;
  readonly apiRouteBindingGateRequired: true;
  readonly apiRouteBindingCanBeActiveWithoutPublicLookup: boolean;
  readonly apiRouteDatabaseBindingDoesNotActivatePublicLookup: boolean;
  readonly publicLookupPreflightReady: boolean;
  readonly actualPublicLookupPageBindingApplied: false;
  readonly publicLookupRemainsDisabled: true;
  readonly publicPageDatabaseReadAllowed: false;
  readonly publicPageDatabaseReadExecuted: false;
  readonly networkLookupSmokeAllowed: false;
  readonly networkQueryExecuted: false;
  readonly productionMutationSmokeAllowed: false;
  readonly persistentPublicLookupRoutePresent: false;
  readonly publicApiRouteBindingRollbackAvailable: true;
  readonly rollbackToMemoryRequested: boolean;
  readonly pageContextBlocked: boolean;
  readonly publicApiRouteContextBlocked: boolean;
  readonly acknowledgeApiRouteBindingDoesNotActivatePublicLookup: boolean;
  readonly acknowledgePublicLookupRemainsDisabled: boolean;
  readonly acknowledgeNoPublicPageDatabaseRead: boolean;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_RULES = [
  'api-route-database-binding-does-not-activate-public-result-page-lookup',
  'public-result-page-lookup-requires-own-activation-flag',
  'public-result-page-lookup-requires-own-preflight-flag',
  'complete-server-only-database-env-is-required',
  'api-route-database-binding-implementation-gate-must-remain-green',
  'rollback-and-failure-evidence-pack-must-remain-green',
  'preflight-readiness-does-not-enable-public-page-database-read',
  'public-result-page-context-remains-blocked-until-page-implementation-phase',
  'network-lookup-smoke-remains-blocked',
  'production-mutation-smoke-remains-blocked'
] as const;

export function resolvePublicResultLookupPageDatabasePreflightDecision(
  options: PublicResultLookupPageDatabasePreflightOptions = {}
): PublicResultLookupPageDatabasePreflightDecision {
  const env = options.env ?? {};
  const context = options.context ?? 'unspecified';
  const requestedStorageMode = env[PUBLIC_RESULT_STORAGE_MODE_ENV];
  const requestedApiRouteBindingImplementationFlag = env[PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENV];
  const requestedRollbackFlag = env[PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV];
  const requestedPublicLookupActivationFlag = env[PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV];
  const requestedPublicLookupPreflightFlag = env[PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV];

  const databaseStorageModeRequested = requestedStorageMode === PUBLIC_RESULT_STORAGE_DATABASE_MODE;
  const apiRouteBindingImplementationFlagPresent =
    requestedApiRouteBindingImplementationFlag === PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_IMPLEMENTATION_ENABLED;
  const publicLookupActivationFlagPresent =
    requestedPublicLookupActivationFlag === PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED;
  const publicLookupPreflightFlagPresent =
    requestedPublicLookupPreflightFlag === PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED;
  const rollbackToMemoryRequested = requestedRollbackFlag === PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY;
  const pageContextBlocked = context === 'public-result-page';
  const publicApiRouteContextBlocked = context === 'public-api-route-handler';
  const acknowledgeApiRouteBindingDoesNotActivatePublicLookup =
    options.acknowledgeApiRouteBindingDoesNotActivatePublicLookup === true;
  const acknowledgePublicLookupRemainsDisabled = options.acknowledgePublicLookupRemainsDisabled === true;
  const acknowledgeNoPublicPageDatabaseRead = options.acknowledgeNoPublicPageDatabaseRead === true;

  const apiRouteBindingEnv = withoutPublicLookupFlags(env);
  const apiRouteBindingDecision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({
    env: apiRouteBindingEnv,
    context: 'public-api-route-handler'
  });
  const completeDatabaseEnvPresent =
    apiRouteBindingDecision.status === 'database-adapter-selected-for-public-api-route' &&
    apiRouteBindingDecision.clientSmokeStatus === 'client-created-smoke-only';
  const apiRouteBindingCanBeActiveWithoutPublicLookup =
    apiRouteBindingDecision.routeBindingApplied === true && !publicLookupActivationFlagPresent;

  const issues = [
    ...(databaseStorageModeRequested ? [] : [`database_storage_mode_required:${requestedStorageMode ?? 'unset'}`]),
    ...(apiRouteBindingImplementationFlagPresent
      ? []
      : [`api_route_database_binding_implementation_flag_required:${requestedApiRouteBindingImplementationFlag ?? 'unset'}`]),
    ...(publicLookupActivationFlagPresent
      ? []
      : [`public_lookup_database_activation_flag_required:${requestedPublicLookupActivationFlag ?? 'unset'}`]),
    ...(publicLookupPreflightFlagPresent
      ? []
      : [`public_lookup_page_database_preflight_flag_required:${requestedPublicLookupPreflightFlag ?? 'unset'}`]),
    ...(completeDatabaseEnvPresent ? [] : [`complete_database_env_required:${apiRouteBindingDecision.status}`]),
    ...(acknowledgeApiRouteBindingDoesNotActivatePublicLookup
      ? []
      : ['api_route_binding_does_not_activate_public_lookup_acknowledgement_required']),
    ...(acknowledgePublicLookupRemainsDisabled ? [] : ['public_lookup_remains_disabled_acknowledgement_required']),
    ...(acknowledgeNoPublicPageDatabaseRead ? [] : ['no_public_page_database_read_acknowledgement_required']),
    ...(context === 'public-result-lookup-page-preflight'
      ? []
      : [`public_result_lookup_page_preflight_context_required:${context}`]),
    ...(pageContextBlocked ? ['public_result_page_context_blocked_until_lookup_implementation_phase'] : []),
    ...(publicApiRouteContextBlocked ? ['public_api_route_handler_context_not_valid_for_lookup_page_preflight'] : []),
    ...(rollbackToMemoryRequested ? ['rollback_to_memory_blocks_public_lookup_preflight'] : [])
  ];

  const publicLookupPreflightReady = issues.length === 0;

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE,
    mode: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_MODE,
    context,
    status: publicLookupPreflightReady
      ? 'public-result-lookup-page-preflight-ready-but-disabled'
      : 'public-result-lookup-page-preflight-blocked',
    requestedStorageMode,
    requestedApiRouteBindingImplementationFlag,
    requestedRollbackFlag,
    requestedPublicLookupActivationFlag,
    requestedPublicLookupPreflightFlag,
    databaseStorageModeRequested,
    apiRouteBindingImplementationFlagPresent,
    publicLookupActivationFlagPresent,
    publicLookupPreflightFlagPresent,
    completeDatabaseEnvPresent,
    apiRouteBindingDecisionStatus: apiRouteBindingDecision.status,
    apiRouteBindingGateRequired: true,
    apiRouteBindingCanBeActiveWithoutPublicLookup,
    apiRouteDatabaseBindingDoesNotActivatePublicLookup: true,
    publicLookupPreflightReady,
    actualPublicLookupPageBindingApplied: false,
    publicLookupRemainsDisabled: true,
    publicPageDatabaseReadAllowed: false,
    publicPageDatabaseReadExecuted: false,
    networkLookupSmokeAllowed: false,
    networkQueryExecuted: false,
    productionMutationSmokeAllowed: false,
    persistentPublicLookupRoutePresent: false,
    publicApiRouteBindingRollbackAvailable: true,
    rollbackToMemoryRequested,
    pageContextBlocked,
    publicApiRouteContextBlocked,
    acknowledgeApiRouteBindingDoesNotActivatePublicLookup,
    acknowledgePublicLookupRemainsDisabled,
    acknowledgeNoPublicPageDatabaseRead,
    issues
  };
}

export function buildCompletePublicResultLookupPageDatabasePreflightEnvironment(): PublicResultLookupPageDatabasePreflightEnvironment {
  return {
    ...buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment(),
    [PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV]: PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED,
    [PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV]: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED
  };
}

export function buildApiRouteDatabaseBindingWithoutPublicLookupEnvironment(): PublicResultLookupPageDatabasePreflightEnvironment {
  return buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment();
}

export function buildPublicResultLookupPageDatabasePreflightRollbackEnvironment(): PublicResultLookupPageDatabasePreflightEnvironment {
  return {
    ...buildCompletePublicResultLookupPageDatabasePreflightEnvironment(),
    [PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV]: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY
  };
}

export function summarizePublicResultLookupPageDatabasePreflightRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_MODE}`,
    `activation:${PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV}=${PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED}`,
    `preflight:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV}=${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENABLED}`,
    ...PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_RULES
  ];
}

function withoutPublicLookupFlags(env: PublicResultStorageRuntimeEnvironment): PublicResultStorageRuntimeEnvironment {
  const next = { ...env };
  delete next[PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV];
  delete next[PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_ENV];
  return next;
}
