import {
  buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY,
  resolvePublicResultApiRouteDatabaseBindingImplementationDecision
} from './publicResultApiRouteDatabaseBindingImplementation';
import {
  buildCompletePublicResultLookupOperationalSmokeEnvironment,
  runPublicResultLookupOperationalSmokeBoundary
} from './publicResultLookupOperationalSmokeBoundary';
import {
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
  createPublicResultLookupPageImplementationFixtureAdapter,
  resolvePublicResultLookupPageImplementationView,
  type PublicResultLookupPageImplementationView
} from './publicResultLookupPageImplementation';
import type { PublicResultStorageRuntimeEnvironment } from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SCHEMA_VERSION =
  'phase-8.21-public-lookup-operational-rollback-drill-v1' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_PHASE =
  'phase-8.21-public-lookup-operational-rollback-drill' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_MODE =
  'api-route-and-public-lookup-rollback-drill-fake-executor-only' as const;

export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENV =
  'PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENABLED = 'enabled' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_ENV =
  'PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_FAKE_EXECUTOR =
  'fake-executor-only' as const;

export type PublicLookupOperationalRollbackDrillContext =
  | 'public-lookup-operational-rollback-drill'
  | 'public-lookup-operational-rollback-drill-gate'
  | 'unspecified';

export type PublicLookupOperationalRollbackDrillStatus =
  | 'public-lookup-operational-rollback-drill-passed'
  | 'public-lookup-operational-rollback-drill-blocked'
  | 'public-lookup-operational-rollback-drill-failed';

export interface PublicLookupOperationalRollbackDrillOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicLookupOperationalRollbackDrillContext;
}

export interface PublicLookupOperationalRollbackViewSummary {
  readonly status: PublicResultLookupPageImplementationView['status'];
  readonly httpStatus: PublicResultLookupPageImplementationView['httpStatus'];
  readonly dtoPresent: boolean;
  readonly databaseReadAttempted: boolean;
  readonly databaseReadExecuted: boolean;
  readonly rawAnswersExposed: boolean;
  readonly rawDeleteTokenExposed: boolean;
  readonly issues: readonly string[];
}

export interface PublicLookupOperationalRollbackDrillReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_PHASE;
  readonly mode: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_MODE;
  readonly context: PublicLookupOperationalRollbackDrillContext;
  readonly status: PublicLookupOperationalRollbackDrillStatus;
  readonly drillOptIn: boolean;
  readonly fakeExecutorOnly: boolean;
  readonly apiRouteDatabaseBindingBeforeRollbackStatus: string;
  readonly apiRouteDatabaseBindingBeforeRollbackActive: boolean;
  readonly publicLookupBeforeRollbackStatus: PublicResultLookupPageImplementationView['status'];
  readonly publicLookupBeforeRollbackHttpStatus: PublicResultLookupPageImplementationView['httpStatus'];
  readonly publicLookupBeforeRollbackRenderable: boolean;
  readonly operationalSmokeBeforeRollbackStatus: string;
  readonly rollbackFlagApplied: boolean;
  readonly apiRouteStorageAfterRollbackStatus: string;
  readonly apiRouteStorageAfterRollbackMemorySelected: boolean;
  readonly publicLookupAfterRollback: PublicLookupOperationalRollbackViewSummary;
  readonly missingAfterRollback: PublicLookupOperationalRollbackViewSummary;
  readonly deletedAfterRollback: PublicLookupOperationalRollbackViewSummary;
  readonly expiredAfterRollback: PublicLookupOperationalRollbackViewSummary;
  readonly rollbackDisablesPublicLookupRendering: boolean;
  readonly rollbackDoesNotExposeStaleDatabaseDto: boolean;
  readonly unavailableStatesRemainDtoFreeAfterRollback: boolean;
  readonly deletedExpiredMissingStatesVerifiedBeforeRollback: boolean;
  readonly rawAnswersExposed: boolean;
  readonly rawDeleteTokenExposed: boolean;
  readonly networkLookupSmokeExecuted: false;
  readonly productionNetworkLookupSmokeExecuted: false;
  readonly productionMutationSmokeExecuted: false;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_RULES = [
  'rollback-drill-is-explicit-opt-in-only',
  'rollback-drill-is-fake-executor-only',
  'api-route-database-binding-can-be-selected-before-rollback',
  'public-lookup-can-render-before-rollback-in-safe-mode',
  'single-rollback-flag-forces-api-route-storage-to-memory',
  'single-rollback-flag-disables-public-lookup-rendering',
  'rollback-does-not-expose-stale-database-dto',
  'deleted-expired-missing-states-remain-dto-free-after-rollback',
  'raw-answers-remain-blocked-through-rollback',
  'raw-delete-token-remains-blocked-through-rollback',
  'production-network-lookup-smoke-remains-disabled-by-default'
] as const;

export async function runPublicLookupOperationalRollbackDrill(
  options: PublicLookupOperationalRollbackDrillOptions = {}
): Promise<PublicLookupOperationalRollbackDrillReport> {
  const env = options.env ?? buildCompletePublicLookupOperationalRollbackDrillEnvironment();
  const context = options.context ?? 'unspecified';
  const drillOptIn = env[PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENV] === PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENABLED;
  const fakeExecutorOnly = env[PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_ENV] === PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_FAKE_EXECUTOR;
  const contextValid = context === 'public-lookup-operational-rollback-drill' || context === 'public-lookup-operational-rollback-drill-gate';

  const setupIssues = [
    ...(drillOptIn ? [] : ['rollback_drill_opt_in_required']),
    ...(fakeExecutorOnly ? [] : [`rollback_drill_fake_executor_safe_mode_required:${env[PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_ENV] ?? 'unset'}`]),
    ...(contextValid ? [] : [`rollback_drill_context_required:${context}`])
  ];

  const apiEnv = buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment();
  const apiBeforeRollback = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({
    env: apiEnv,
    context: 'implementation-gate'
  });
  const lookupEnv = withoutRollbackFlag(env);
  const adapter = createPublicResultLookupPageImplementationFixtureAdapter();
  const publicLookupBeforeRollback = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
    env: lookupEnv,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  });
  const beforeMissing = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
    env: lookupEnv,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  });
  const beforeDeleted = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
    env: lookupEnv,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  });
  const beforeExpired = await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
    env: lookupEnv,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  });
  const operationalSmokeBeforeRollback = await runPublicResultLookupOperationalSmokeBoundary({
    env: lookupEnv,
    context: 'public-result-lookup-operational-smoke-boundary',
    adapter
  });

  const rollbackEnv = {
    ...lookupEnv,
    [PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV]: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY
  };
  const apiAfterRollback = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({
    env: {
      ...apiEnv,
      [PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV]: PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY
    },
    context: 'implementation-gate'
  });
  const publicLookupAfterRollback = summarizeLookupView(await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
    env: rollbackEnv,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  }));
  const missingAfterRollback = summarizeLookupView(await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
    env: rollbackEnv,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  }));
  const deletedAfterRollback = summarizeLookupView(await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
    env: rollbackEnv,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  }));
  const expiredAfterRollback = summarizeLookupView(await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
    env: rollbackEnv,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  }));

  const deletedExpiredMissingStatesVerifiedBeforeRollback =
    beforeMissing.status === 'public-result-page-not-found' && beforeMissing.dto === null &&
    beforeDeleted.status === 'public-result-page-deleted-unavailable' && beforeDeleted.dto === null &&
    beforeExpired.status === 'public-result-page-expired-unavailable' && beforeExpired.dto === null;
  const rollbackDisablesPublicLookupRendering =
    publicLookupAfterRollback.status === 'public-result-page-disabled' &&
    missingAfterRollback.status === 'public-result-page-disabled' &&
    deletedAfterRollback.status === 'public-result-page-disabled' &&
    expiredAfterRollback.status === 'public-result-page-disabled';
  const rollbackDoesNotExposeStaleDatabaseDto = !publicLookupAfterRollback.dtoPresent;
  const unavailableStatesRemainDtoFreeAfterRollback =
    !missingAfterRollback.dtoPresent && !deletedAfterRollback.dtoPresent && !expiredAfterRollback.dtoPresent;
  const rawAnswersExposed = publicLookupBeforeRollback.rawAnswersExposed || publicLookupAfterRollback.rawAnswersExposed || missingAfterRollback.rawAnswersExposed || deletedAfterRollback.rawAnswersExposed || expiredAfterRollback.rawAnswersExposed;
  const rawDeleteTokenExposed = publicLookupBeforeRollback.rawDeleteTokenExposed || publicLookupAfterRollback.rawDeleteTokenExposed || missingAfterRollback.rawDeleteTokenExposed || deletedAfterRollback.rawDeleteTokenExposed || expiredAfterRollback.rawDeleteTokenExposed;
  const apiRouteDatabaseBindingBeforeRollbackActive = apiBeforeRollback.status === 'database-adapter-selected-for-public-api-route';
  const publicLookupBeforeRollbackRenderable = publicLookupBeforeRollback.status === 'public-result-page-renderable' && publicLookupBeforeRollback.httpStatus === 200 && publicLookupBeforeRollback.dto !== null;
  const apiRouteStorageAfterRollbackMemorySelected = apiAfterRollback.status === 'memory-adapter-selected-rollback';

  const behaviorIssues = [
    ...(apiRouteDatabaseBindingBeforeRollbackActive ? [] : [`api_route_database_binding_not_active_before_rollback:${apiBeforeRollback.status}`]),
    ...(publicLookupBeforeRollbackRenderable ? [] : [`public_lookup_not_renderable_before_rollback:${publicLookupBeforeRollback.status}`]),
    ...(operationalSmokeBeforeRollback.status === 'public-result-lookup-operational-smoke-passed' ? [] : [`operational_smoke_not_green_before_rollback:${operationalSmokeBeforeRollback.status}`]),
    ...(apiRouteStorageAfterRollbackMemorySelected ? [] : [`api_route_storage_not_memory_after_rollback:${apiAfterRollback.status}`]),
    ...(rollbackDisablesPublicLookupRendering ? [] : ['rollback_did_not_disable_all_public_lookup_rendering']),
    ...(rollbackDoesNotExposeStaleDatabaseDto ? [] : ['rollback_exposed_stale_database_dto']),
    ...(unavailableStatesRemainDtoFreeAfterRollback ? [] : ['unavailable_states_exposed_dto_after_rollback']),
    ...(deletedExpiredMissingStatesVerifiedBeforeRollback ? [] : ['deleted_expired_missing_states_not_verified_before_rollback']),
    ...(rawAnswersExposed ? ['raw_answers_exposed_during_rollback_drill'] : []),
    ...(rawDeleteTokenExposed ? ['raw_delete_token_exposed_during_rollback_drill'] : [])
  ];
  const issues = [...setupIssues, ...behaviorIssues];

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_PHASE,
    mode: PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_MODE,
    context,
    status: setupIssues.length > 0
      ? 'public-lookup-operational-rollback-drill-blocked'
      : issues.length === 0
        ? 'public-lookup-operational-rollback-drill-passed'
        : 'public-lookup-operational-rollback-drill-failed',
    drillOptIn,
    fakeExecutorOnly,
    apiRouteDatabaseBindingBeforeRollbackStatus: apiBeforeRollback.status,
    apiRouteDatabaseBindingBeforeRollbackActive,
    publicLookupBeforeRollbackStatus: publicLookupBeforeRollback.status,
    publicLookupBeforeRollbackHttpStatus: publicLookupBeforeRollback.httpStatus,
    publicLookupBeforeRollbackRenderable,
    operationalSmokeBeforeRollbackStatus: operationalSmokeBeforeRollback.status,
    rollbackFlagApplied: true,
    apiRouteStorageAfterRollbackStatus: apiAfterRollback.status,
    apiRouteStorageAfterRollbackMemorySelected,
    publicLookupAfterRollback,
    missingAfterRollback,
    deletedAfterRollback,
    expiredAfterRollback,
    rollbackDisablesPublicLookupRendering,
    rollbackDoesNotExposeStaleDatabaseDto,
    unavailableStatesRemainDtoFreeAfterRollback,
    deletedExpiredMissingStatesVerifiedBeforeRollback,
    rawAnswersExposed,
    rawDeleteTokenExposed,
    networkLookupSmokeExecuted: false,
    productionNetworkLookupSmokeExecuted: false,
    productionMutationSmokeExecuted: false,
    issues
  };
}

export function buildCompletePublicLookupOperationalRollbackDrillEnvironment(): PublicResultStorageRuntimeEnvironment {
  return {
    ...buildCompletePublicResultLookupOperationalSmokeEnvironment(),
    [PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENV]: PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENABLED,
    [PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_ENV]: PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_FAKE_EXECUTOR
  };
}

export function summarizePublicLookupOperationalRollbackDrillRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SCHEMA_VERSION}`,
    `flag:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENV}=${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_ENABLED}`,
    `safeMode:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_ENV}=${PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_SAFE_MODE_FAKE_EXECUTOR}`,
    `rollback:${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV}=${PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY}`,
    ...PUBLIC_RESULT_LOOKUP_OPERATIONAL_ROLLBACK_DRILL_RULES
  ];
}

function summarizeLookupView(view: PublicResultLookupPageImplementationView): PublicLookupOperationalRollbackViewSummary {
  return {
    status: view.status,
    httpStatus: view.httpStatus,
    dtoPresent: view.dto !== null,
    databaseReadAttempted: view.databaseReadAttempted,
    databaseReadExecuted: view.databaseReadExecuted,
    rawAnswersExposed: view.rawAnswersExposed,
    rawDeleteTokenExposed: view.rawDeleteTokenExposed,
    issues: view.issues
  };
}

function withoutRollbackFlag(env: PublicResultStorageRuntimeEnvironment): PublicResultStorageRuntimeEnvironment {
  const { [PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV]: _removed, ...rest } = env;
  return rest;
}
