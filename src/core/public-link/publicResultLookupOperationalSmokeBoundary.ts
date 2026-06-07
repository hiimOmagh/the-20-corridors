import {
  createPublicResultLookupPageImplementationFixtureAdapter,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
  PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE,
  resolvePublicResultLookupPageImplementationView,
  type PublicResultLookupPageImplementationView
} from './publicResultLookupPageImplementation';
import { buildCompletePublicResultLookupPageDatabaseActivationEnvironment } from './publicResultLookupPageDatabaseActivation';
import {
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY
} from './publicResultApiRouteDatabaseBindingImplementation';
import type { PublicResultStorageAdapter } from './publicResultStorage';
import type { PublicResultStorageRuntimeEnvironment } from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION =
  'phase-8.20-public-result-lookup-operational-smoke-boundary-v1' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_PHASE =
  'phase-8.20-public-result-lookup-operational-smoke-boundary' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_MODE =
  'public-result-lookup-operational-smoke-opt-in-non-production' as const;

export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENV = 'PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENABLED = 'enabled' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT_ENV = 'PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_ENV = 'PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE' as const;
export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_FAKE_EXECUTOR = 'fake-executor-only' as const;

export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ALLOWED_ENVIRONMENTS = [
  'local',
  'test',
  'staging',
  'non-production'
] as const;

export type PublicResultLookupOperationalSmokeContext =
  | 'public-result-lookup-operational-smoke-boundary'
  | 'public-result-lookup-operational-smoke-gate'
  | 'unspecified';

export type PublicResultLookupOperationalSmokeStatus =
  | 'public-result-lookup-operational-smoke-passed'
  | 'public-result-lookup-operational-smoke-blocked'
  | 'public-result-lookup-operational-smoke-configuration-error';

export interface PublicResultLookupOperationalSmokeOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicResultLookupOperationalSmokeContext;
  readonly adapter?: PublicResultStorageAdapter;
}

export interface PublicResultLookupOperationalSmokeStateSummary {
  readonly status: PublicResultLookupPageImplementationView['status'] | 'not-executed';
  readonly httpStatus: PublicResultLookupPageImplementationView['httpStatus'] | null;
  readonly dtoPresent: boolean;
  readonly databaseReadAttempted: boolean;
  readonly databaseReadExecuted: boolean;
  readonly publicDtoOnly: boolean;
  readonly rawAnswersExposed: boolean;
  readonly rawDeleteTokenExposed: boolean;
  readonly issues: readonly string[];
}

export interface PublicResultLookupOperationalSmokeBoundaryReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_PHASE;
  readonly mode: typeof PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_MODE;
  readonly implementationPhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE;
  readonly context: PublicResultLookupOperationalSmokeContext;
  readonly status: PublicResultLookupOperationalSmokeStatus;
  readonly operationalSmokeOptIn: boolean;
  readonly requestedEnvironment: string | undefined;
  readonly nonProductionEnvironmentConfirmed: boolean;
  readonly safeModeConfirmed: boolean;
  readonly productionEnvironmentRejected: boolean;
  readonly rollbackToMemoryRequested: boolean;
  readonly fakeExecutorOnly: boolean;
  readonly activeLookup: PublicResultLookupOperationalSmokeStateSummary;
  readonly readMissLookup: PublicResultLookupOperationalSmokeStateSummary;
  readonly deletedLookup: PublicResultLookupOperationalSmokeStateSummary;
  readonly expiredLookup: PublicResultLookupOperationalSmokeStateSummary;
  readonly dtoOnlyRenderingVerified: boolean;
  readonly deletedExpiredMissingExposeNoDto: boolean;
  readonly rawAnswersExposed: boolean;
  readonly rawDeleteTokenExposed: boolean;
  readonly actualPublicLookupPageBindingApplied: boolean;
  readonly networkLookupSmokeExecuted: false;
  readonly productionNetworkLookupSmokeExecuted: false;
  readonly productionMutationSmokeExecuted: false;
  readonly publicResultPageRouteSmokeUsesRealNetwork: false;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_RULES = [
  'public-result-lookup-operational-smoke-is-explicit-opt-in-only',
  'public-result-lookup-operational-smoke-refuses-production-environment',
  'public-result-lookup-operational-smoke-requires-safe-fake-executor-mode',
  'public-result-lookup-operational-smoke-rolls-back-to-disabled-lookup-when-rollback-memory-is-set',
  'public-result-lookup-operational-smoke-fails-closed-on-missing-or-invalid-env',
  'public-result-lookup-operational-smoke-verifies-active-renderable-dto-only-state',
  'public-result-lookup-operational-smoke-verifies-missing-deleted-expired-non-dto-states',
  'public-result-lookup-operational-smoke-never-exposes-raw-answers',
  'public-result-lookup-operational-smoke-never-exposes-raw-delete-token',
  'public-result-lookup-operational-smoke-runs-no-production-network-lookup-by-default'
] as const;

const NOT_EXECUTED_STATE: PublicResultLookupOperationalSmokeStateSummary = {
  status: 'not-executed',
  httpStatus: null,
  dtoPresent: false,
  databaseReadAttempted: false,
  databaseReadExecuted: false,
  publicDtoOnly: true,
  rawAnswersExposed: false,
  rawDeleteTokenExposed: false,
  issues: []
};

export async function runPublicResultLookupOperationalSmokeBoundary(
  options: PublicResultLookupOperationalSmokeOptions = {}
): Promise<PublicResultLookupOperationalSmokeBoundaryReport> {
  const env = options.env ?? {};
  const context = options.context ?? 'unspecified';
  const requestedEnvironment = env[PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT_ENV];
  const operationalSmokeOptIn = env[PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENV] === PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENABLED;
  const safeModeConfirmed = env[PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_ENV] === PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_FAKE_EXECUTOR;
  const nonProductionEnvironmentConfirmed = isAllowedNonProductionEnvironment(requestedEnvironment);
  const productionEnvironmentRejected = requestedEnvironment === 'production';
  const rollbackToMemoryRequested = env[PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV] === PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY;
  const contextValid = context === 'public-result-lookup-operational-smoke-boundary' || context === 'public-result-lookup-operational-smoke-gate';

  const baseIssues = [
    ...(operationalSmokeOptIn ? [] : ['operational_smoke_opt_in_required']),
    ...(safeModeConfirmed ? [] : [`safe_fake_executor_mode_required:${env[PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_ENV] ?? 'unset'}`]),
    ...(nonProductionEnvironmentConfirmed ? [] : [`non_production_environment_required:${requestedEnvironment ?? 'unset'}`]),
    ...(productionEnvironmentRejected ? ['production_environment_rejected_for_public_lookup_operational_smoke'] : []),
    ...(rollbackToMemoryRequested ? ['rollback_to_memory_blocks_public_lookup_operational_smoke'] : []),
    ...(contextValid ? [] : [`operational_smoke_context_required:${context}`])
  ];

  const blockedBeforeLookup = baseIssues.length > 0;
  if (blockedBeforeLookup) {
    return buildReport({
      context,
      status: 'public-result-lookup-operational-smoke-blocked',
      operationalSmokeOptIn,
      requestedEnvironment,
      nonProductionEnvironmentConfirmed,
      safeModeConfirmed,
      productionEnvironmentRejected,
      rollbackToMemoryRequested,
      activeLookup: NOT_EXECUTED_STATE,
      readMissLookup: NOT_EXECUTED_STATE,
      deletedLookup: NOT_EXECUTED_STATE,
      expiredLookup: NOT_EXECUTED_STATE,
      issues: baseIssues
    });
  }

  const adapter = options.adapter ?? createPublicResultLookupPageImplementationFixtureAdapter();
  const activeLookup = summarizeView(await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_ACTIVE_PUBLIC_ID,
    env,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  }));
  const readMissLookup = summarizeView(await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_MISSING_PUBLIC_ID,
    env,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  }));
  const deletedLookup = summarizeView(await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_DELETED_PUBLIC_ID,
    env,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  }));
  const expiredLookup = summarizeView(await resolvePublicResultLookupPageImplementationView({
    publicId: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_EXPIRED_PUBLIC_ID,
    env,
    context: 'public-result-lookup-page-implementation-gate',
    adapter
  }));

  const stateIssues = [
    ...(activeLookup.status === 'public-result-page-renderable' && activeLookup.httpStatus === 200 && activeLookup.dtoPresent ? [] : [`active_lookup_not_renderable:${activeLookup.status}`]),
    ...(readMissLookup.status === 'public-result-page-not-found' && readMissLookup.httpStatus === 404 && !readMissLookup.dtoPresent ? [] : [`read_miss_lookup_not_not_found:${readMissLookup.status}`]),
    ...(deletedLookup.status === 'public-result-page-deleted-unavailable' && deletedLookup.httpStatus === 410 && !deletedLookup.dtoPresent ? [] : [`deleted_lookup_not_unavailable:${deletedLookup.status}`]),
    ...(expiredLookup.status === 'public-result-page-expired-unavailable' && expiredLookup.httpStatus === 410 && !expiredLookup.dtoPresent ? [] : [`expired_lookup_not_unavailable:${expiredLookup.status}`]),
    ...(activeLookup.publicDtoOnly ? [] : ['active_lookup_not_dto_only']),
    ...activeLookup.issues.map((issue) => `active_lookup:${issue}`),
    ...readMissLookup.issues.map((issue) => `read_miss_lookup:${issue}`),
    ...deletedLookup.issues.map((issue) => `deleted_lookup:${issue}`),
    ...expiredLookup.issues.map((issue) => `expired_lookup:${issue}`)
  ];

  const status: PublicResultLookupOperationalSmokeStatus = stateIssues.length === 0
    ? 'public-result-lookup-operational-smoke-passed'
    : 'public-result-lookup-operational-smoke-configuration-error';

  return buildReport({
    context,
    status,
    operationalSmokeOptIn,
    requestedEnvironment,
    nonProductionEnvironmentConfirmed,
    safeModeConfirmed,
    productionEnvironmentRejected,
    rollbackToMemoryRequested,
    activeLookup,
    readMissLookup,
    deletedLookup,
    expiredLookup,
    issues: stateIssues
  });
}

export function buildCompletePublicResultLookupOperationalSmokeEnvironment(): PublicResultStorageRuntimeEnvironment {
  return {
    ...buildCompletePublicResultLookupPageDatabaseActivationEnvironment(),
    [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENV]: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENABLED,
    [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENVIRONMENT_ENV]: 'non-production',
    [PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_ENV]: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_FAKE_EXECUTOR
  };
}

export function summarizePublicResultLookupOperationalSmokeRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION}`,
    `flag:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENV}=${PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ENABLED}`,
    `safeMode:${PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_ENV}=${PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_SAFE_MODE_FAKE_EXECUTOR}`,
    ...PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_RULES
  ];
}

function buildReport(input: {
  readonly context: PublicResultLookupOperationalSmokeContext;
  readonly status: PublicResultLookupOperationalSmokeStatus;
  readonly operationalSmokeOptIn: boolean;
  readonly requestedEnvironment: string | undefined;
  readonly nonProductionEnvironmentConfirmed: boolean;
  readonly safeModeConfirmed: boolean;
  readonly productionEnvironmentRejected: boolean;
  readonly rollbackToMemoryRequested: boolean;
  readonly activeLookup: PublicResultLookupOperationalSmokeStateSummary;
  readonly readMissLookup: PublicResultLookupOperationalSmokeStateSummary;
  readonly deletedLookup: PublicResultLookupOperationalSmokeStateSummary;
  readonly expiredLookup: PublicResultLookupOperationalSmokeStateSummary;
  readonly issues: readonly string[];
}): PublicResultLookupOperationalSmokeBoundaryReport {
  const rawAnswersExposed = input.activeLookup.rawAnswersExposed || input.readMissLookup.rawAnswersExposed || input.deletedLookup.rawAnswersExposed || input.expiredLookup.rawAnswersExposed;
  const rawDeleteTokenExposed = input.activeLookup.rawDeleteTokenExposed || input.readMissLookup.rawDeleteTokenExposed || input.deletedLookup.rawDeleteTokenExposed || input.expiredLookup.rawDeleteTokenExposed;
  const dtoOnlyRenderingVerified = input.activeLookup.status === 'public-result-page-renderable' && input.activeLookup.dtoPresent && input.activeLookup.publicDtoOnly && !rawAnswersExposed && !rawDeleteTokenExposed;
  const deletedExpiredMissingExposeNoDto = !input.readMissLookup.dtoPresent && !input.deletedLookup.dtoPresent && !input.expiredLookup.dtoPresent;

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_PHASE,
    mode: PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_BOUNDARY_MODE,
    implementationPhase: PUBLIC_RESULT_LOOKUP_PAGE_IMPLEMENTATION_PHASE,
    context: input.context,
    status: input.status,
    operationalSmokeOptIn: input.operationalSmokeOptIn,
    requestedEnvironment: input.requestedEnvironment,
    nonProductionEnvironmentConfirmed: input.nonProductionEnvironmentConfirmed,
    safeModeConfirmed: input.safeModeConfirmed,
    productionEnvironmentRejected: input.productionEnvironmentRejected,
    rollbackToMemoryRequested: input.rollbackToMemoryRequested,
    fakeExecutorOnly: true,
    activeLookup: input.activeLookup,
    readMissLookup: input.readMissLookup,
    deletedLookup: input.deletedLookup,
    expiredLookup: input.expiredLookup,
    dtoOnlyRenderingVerified,
    deletedExpiredMissingExposeNoDto,
    rawAnswersExposed,
    rawDeleteTokenExposed,
    actualPublicLookupPageBindingApplied: input.activeLookup.databaseReadExecuted || input.readMissLookup.databaseReadExecuted || input.deletedLookup.databaseReadExecuted || input.expiredLookup.databaseReadExecuted,
    networkLookupSmokeExecuted: false,
    productionNetworkLookupSmokeExecuted: false,
    productionMutationSmokeExecuted: false,
    publicResultPageRouteSmokeUsesRealNetwork: false,
    issues: input.issues
  };
}

function summarizeView(view: PublicResultLookupPageImplementationView): PublicResultLookupOperationalSmokeStateSummary {
  return {
    status: view.status,
    httpStatus: view.httpStatus,
    dtoPresent: view.dto !== null,
    databaseReadAttempted: view.databaseReadAttempted,
    databaseReadExecuted: view.databaseReadExecuted,
    publicDtoOnly: view.publicDtoOnly,
    rawAnswersExposed: view.rawAnswersExposed,
    rawDeleteTokenExposed: view.rawDeleteTokenExposed,
    issues: view.issues
  };
}

function isAllowedNonProductionEnvironment(value: string | undefined): boolean {
  return PUBLIC_RESULT_LOOKUP_OPERATIONAL_SMOKE_ALLOWED_ENVIRONMENTS.some((allowed) => allowed === value);
}
