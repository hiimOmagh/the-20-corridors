import {
  buildCompletePublicResultLookupPageDatabaseDryRunEnvironment,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION,
  runPublicResultLookupPageDatabaseDryRun,
  type PublicResultLookupPageDatabaseDryRunReport
} from './publicResultLookupPageDatabaseDryRun';
import {
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION,
  resolvePublicResultLookupPageDatabasePreflightDecision,
  type PublicResultLookupPageDatabasePreflightDecision
} from './publicResultLookupPageDatabasePreflight';
import {
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV,
  PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV
} from './publicResultApiRouteDatabaseBindingImplementation';
import type { PublicResultStorageRuntimeEnvironment } from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION =
  'phase-8.18-public-result-lookup-page-activation-contract-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE =
  'phase-8.18-public-result-lookup-page-activation-contract' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_MODE =
  'public-result-lookup-page-activation-ready-not-applied' as const;

export type PublicResultLookupPageDatabaseActivationContext =
  | 'public-result-lookup-page-activation-contract'
  | 'public-result-page'
  | 'public-api-route-handler'
  | 'unspecified';

export type PublicResultLookupPageDatabaseActivationStatus =
  | 'public-result-lookup-page-activation-ready-not-applied'
  | 'public-result-lookup-page-activation-blocked';

export interface PublicResultLookupPageDatabaseActivationOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicResultLookupPageDatabaseActivationContext;
  readonly acknowledgeActivationDecisionOnly?: boolean;
  readonly acknowledgeNoRealPageDatabaseRead?: boolean;
  readonly acknowledgePageRouteImplementationSeparate?: boolean;
  readonly acknowledgeRollbackBlocksLookupActivation?: boolean;
}

export interface PublicResultLookupPageDatabaseActivationDecision {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE;
  readonly mode: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_MODE;
  readonly preflightSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION;
  readonly preflightPhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE;
  readonly dryRunSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION;
  readonly dryRunPhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE;
  readonly context: PublicResultLookupPageDatabaseActivationContext;
  readonly status: PublicResultLookupPageDatabaseActivationStatus;
  readonly requestedPublicLookupActivationFlag: string | undefined;
  readonly requestedRollbackFlag: string | undefined;
  readonly publicLookupActivationFlagPresent: boolean;
  readonly rollbackToMemoryRequested: boolean;
  readonly preflightStatus: PublicResultDatabasePreflightStatusSummary;
  readonly dryRunStatus: PublicResultDatabaseDryRunStatusSummary;
  readonly completeDatabaseEnvPresent: boolean;
  readonly apiRouteDatabaseBindingGateValid: boolean;
  readonly rollbackFailureEvidenceRequired: true;
  readonly dryRunContractRequired: true;
  readonly activationDecisionReady: boolean;
  readonly activationDecisionOnlyAcknowledged: boolean;
  readonly noRealPageDatabaseReadAcknowledged: boolean;
  readonly pageRouteImplementationSeparateAcknowledged: boolean;
  readonly rollbackBlocksLookupActivationAcknowledged: boolean;
  readonly actualPublicLookupPageBindingApplied: false;
  readonly publicPageDatabaseReadAllowed: false;
  readonly realPublicResultPageDatabaseReadExecuted: false;
  readonly productionNetworkLookupSmokeAllowed: false;
  readonly networkLookupExecuted: false;
  readonly productionMutationSmokeAllowed: false;
  readonly persistentPublicLookupRoutePresent: false;
  readonly publicPageRouteImplementationAllowed: false;
  readonly apiRoutePersistenceRollbackStillAvailable: true;
  readonly publicLookupActivationDoesNotBypassRollback: boolean;
  readonly pageContextBlocked: boolean;
  readonly publicApiRouteContextBlocked: boolean;
  readonly issues: readonly string[];
}

export interface PublicResultDatabasePreflightStatusSummary {
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE;
  readonly status: PublicResultLookupPageDatabasePreflightDecision['status'];
  readonly publicLookupPreflightReady: boolean;
  readonly apiRouteBindingCanBeActiveWithoutPublicLookup: boolean;
  readonly actualPublicLookupPageBindingApplied: false;
  readonly networkQueryExecuted: false;
}

export interface PublicResultDatabaseDryRunStatusSummary {
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE;
  readonly status: PublicResultLookupPageDatabaseDryRunReport['status'];
  readonly lookupSimulationPassed: boolean;
  readonly activeLookupHttpStatus: number | null;
  readonly readMissHttpStatus: number | null;
  readonly deletedLookupHttpStatus: number | null;
  readonly expiredLookupHttpStatus: number | null;
  readonly actualPublicLookupPageBindingApplied: false;
  readonly networkQueryExecuted: false;
}

export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_RULES = [
  'public-result-lookup-page-activation-requires-explicit-public-lookup-activation-flag',
  'public-result-lookup-page-activation-requires-complete-database-env',
  'public-result-lookup-page-activation-requires-api-route-database-binding-valid',
  'public-result-lookup-page-activation-requires-phase-8-17-dry-run-green',
  'public-result-lookup-page-activation-does-not-bypass-api-route-rollback-mode',
  'public-result-lookup-page-activation-contract-is-decision-only',
  'actual-public-r-public-id-page-binding-remains-not-applied',
  'no-real-public-page-database-read-in-activation-contract',
  'no-production-network-lookup-smoke',
  'public-page-route-implementation-remains-separate'
] as const;

export async function resolvePublicResultLookupPageDatabaseActivationDecision(
  options: PublicResultLookupPageDatabaseActivationOptions = {}
): Promise<PublicResultLookupPageDatabaseActivationDecision> {
  const env = options.env ?? {};
  const context = options.context ?? 'unspecified';
  const requestedPublicLookupActivationFlag = env[PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV];
  const requestedRollbackFlag = env[PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_ENV];
  const publicLookupActivationFlagPresent =
    requestedPublicLookupActivationFlag === PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED;
  const rollbackToMemoryRequested = requestedRollbackFlag === PUBLIC_RESULT_API_ROUTE_DATABASE_BINDING_ROLLBACK_MEMORY;
  const pageContextBlocked = context === 'public-result-page';
  const publicApiRouteContextBlocked = context === 'public-api-route-handler';
  const activationDecisionOnlyAcknowledged = options.acknowledgeActivationDecisionOnly === true;
  const noRealPageDatabaseReadAcknowledged = options.acknowledgeNoRealPageDatabaseRead === true;
  const pageRouteImplementationSeparateAcknowledged = options.acknowledgePageRouteImplementationSeparate === true;
  const rollbackBlocksLookupActivationAcknowledged = options.acknowledgeRollbackBlocksLookupActivation === true;

  const preflightDecision = resolvePublicResultLookupPageDatabasePreflightDecision({
    env,
    context: 'public-result-lookup-page-preflight',
    acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
    acknowledgePublicLookupRemainsDisabled: true,
    acknowledgeNoPublicPageDatabaseRead: true
  });
  const preflightReady = preflightDecision.status === 'public-result-lookup-page-preflight-ready-but-disabled';

  const dryRun = await runPublicResultLookupPageDatabaseDryRun({
    env: withDryRunFlag(env),
    context: 'public-result-lookup-page-dry-run-contract',
    acknowledgeFakeExecutorOnly: true,
    acknowledgeActualPageLookupRemainsDisabled: true
  });
  const dryRunGreen = dryRun.status === 'public-result-lookup-page-dry-run-passed' && dryRun.lookupSimulationPassed;

  const completeDatabaseEnvPresent = preflightReady && preflightDecision.completeDatabaseEnvPresent;
  const apiRouteDatabaseBindingGateValid = preflightReady && preflightDecision.apiRouteBindingDecisionStatus === 'database-adapter-selected-for-public-api-route';

  const issues = [
    ...(publicLookupActivationFlagPresent
      ? []
      : [`public_lookup_database_activation_flag_required:${requestedPublicLookupActivationFlag ?? 'unset'}`]),
    ...(completeDatabaseEnvPresent ? [] : [`complete_database_env_required:${preflightDecision.apiRouteBindingDecisionStatus}`]),
    ...(apiRouteDatabaseBindingGateValid ? [] : [`api_route_database_binding_gate_required:${preflightDecision.apiRouteBindingDecisionStatus}`]),
    ...(preflightReady ? [] : [`public_lookup_page_preflight_required:${preflightDecision.status}`]),
    ...(dryRunGreen ? [] : [`public_lookup_page_dry_run_required:${dryRun.status}`]),
    ...(activationDecisionOnlyAcknowledged ? [] : ['activation_decision_only_acknowledgement_required']),
    ...(noRealPageDatabaseReadAcknowledged ? [] : ['no_real_public_page_database_read_acknowledgement_required']),
    ...(pageRouteImplementationSeparateAcknowledged ? [] : ['public_page_route_implementation_separate_acknowledgement_required']),
    ...(rollbackBlocksLookupActivationAcknowledged ? [] : ['rollback_blocks_lookup_activation_acknowledgement_required']),
    ...(context === 'public-result-lookup-page-activation-contract'
      ? []
      : [`public_result_lookup_page_activation_context_required:${context}`]),
    ...(pageContextBlocked ? ['public_result_page_context_blocked_until_page_implementation_gate'] : []),
    ...(publicApiRouteContextBlocked ? ['public_api_route_handler_context_not_valid_for_lookup_page_activation'] : []),
    ...(rollbackToMemoryRequested ? ['rollback_to_memory_blocks_public_lookup_activation'] : [])
  ];

  const activationDecisionReady = issues.length === 0;

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE,
    mode: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_MODE,
    preflightSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION,
    preflightPhase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE,
    dryRunSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION,
    dryRunPhase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE,
    context,
    status: activationDecisionReady
      ? 'public-result-lookup-page-activation-ready-not-applied'
      : 'public-result-lookup-page-activation-blocked',
    requestedPublicLookupActivationFlag,
    requestedRollbackFlag,
    publicLookupActivationFlagPresent,
    rollbackToMemoryRequested,
    preflightStatus: {
      phase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE,
      status: preflightDecision.status,
      publicLookupPreflightReady: preflightReady,
      apiRouteBindingCanBeActiveWithoutPublicLookup: preflightDecision.apiRouteBindingCanBeActiveWithoutPublicLookup,
      actualPublicLookupPageBindingApplied: preflightDecision.actualPublicLookupPageBindingApplied,
      networkQueryExecuted: preflightDecision.networkQueryExecuted
    },
    dryRunStatus: {
      phase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE,
      status: dryRun.status,
      lookupSimulationPassed: dryRun.lookupSimulationPassed,
      activeLookupHttpStatus: dryRun.activeLookup?.httpStatus ?? null,
      readMissHttpStatus: dryRun.readMissLookup?.httpStatus ?? null,
      deletedLookupHttpStatus: dryRun.deletedLookup?.httpStatus ?? null,
      expiredLookupHttpStatus: dryRun.expiredLookup?.httpStatus ?? null,
      actualPublicLookupPageBindingApplied: dryRun.actualPublicLookupPageBindingApplied,
      networkQueryExecuted: dryRun.networkQueryExecuted
    },
    completeDatabaseEnvPresent,
    apiRouteDatabaseBindingGateValid,
    rollbackFailureEvidenceRequired: true,
    dryRunContractRequired: true,
    activationDecisionReady,
    activationDecisionOnlyAcknowledged,
    noRealPageDatabaseReadAcknowledged,
    pageRouteImplementationSeparateAcknowledged,
    rollbackBlocksLookupActivationAcknowledged,
    actualPublicLookupPageBindingApplied: false,
    publicPageDatabaseReadAllowed: false,
    realPublicResultPageDatabaseReadExecuted: false,
    productionNetworkLookupSmokeAllowed: false,
    networkLookupExecuted: false,
    productionMutationSmokeAllowed: false,
    persistentPublicLookupRoutePresent: false,
    publicPageRouteImplementationAllowed: false,
    apiRoutePersistenceRollbackStillAvailable: true,
    publicLookupActivationDoesNotBypassRollback: !rollbackToMemoryRequested,
    pageContextBlocked,
    publicApiRouteContextBlocked,
    issues
  };
}

export function buildCompletePublicResultLookupPageDatabaseActivationEnvironment(): PublicResultStorageRuntimeEnvironment {
  return withoutDryRunFlag(buildCompletePublicResultLookupPageDatabaseDryRunEnvironment());
}

export function summarizePublicResultLookupPageDatabaseActivationRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_SCHEMA_VERSION}`,
    `flag:${PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV}=${PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED}`,
    ...PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_ACTIVATION_RULES
  ];
}

function withDryRunFlag(env: PublicResultStorageRuntimeEnvironment): PublicResultStorageRuntimeEnvironment {
  return {
    ...env,
    PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN: 'enabled'
  };
}

function withoutDryRunFlag(env: PublicResultStorageRuntimeEnvironment): PublicResultStorageRuntimeEnvironment {
  const { PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN: _removed, ...rest } = env;
  return rest;
}
