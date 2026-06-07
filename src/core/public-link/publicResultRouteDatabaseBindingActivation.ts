import {
  buildCompletePublicResultRouteDatabaseBindingDryRunEnvironment,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION,
  runPublicResultRouteDatabaseBindingDryRun
} from './publicResultRouteDatabaseBindingDryRun';
import {
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION
} from './publicResultRouteDatabaseBindingPreflight';
import { PUBLIC_RESULT_ROUTE_HANDLERS_MODE } from './publicResultRouteHandlers';
import type { PublicResultStorageRuntimeEnvironment } from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION =
  'phase-8.13-public-route-database-binding-activation-contract-v1' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_PHASE =
  'phase-8.13-public-route-database-binding-activation-contract' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_MODE =
  'api-route-database-binding-activation-ready-not-applied' as const;

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV = 'PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED = 'enabled' as const;
export const PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV = 'PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION' as const;
export const PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED = 'enabled' as const;

export type PublicResultRouteDatabaseBindingActivationContext =
  | 'route-binding-activation-contract'
  | 'public-api-route-handler'
  | 'public-result-page-lookup'
  | 'unspecified';

export type PublicResultRouteDatabaseBindingActivationStatus =
  | 'api-route-database-binding-activation-ready-not-applied'
  | 'api-route-database-binding-activation-blocked';

export interface PublicResultRouteDatabaseBindingActivationOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicResultRouteDatabaseBindingActivationContext;
  readonly acknowledgeApiRouteOnlyActivation?: boolean;
  readonly acknowledgeActualRouteHandlersRemainUnchanged?: boolean;
}

export interface PublicResultRouteDatabaseBindingActivationDecision {
  readonly schemaVersion: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_PHASE;
  readonly mode: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_MODE;
  readonly preflightSchemaVersion: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION;
  readonly preflightPhase: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE;
  readonly dryRunSchemaVersion: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION;
  readonly dryRunPhase: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE;
  readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  readonly context: PublicResultRouteDatabaseBindingActivationContext;
  readonly status: PublicResultRouteDatabaseBindingActivationStatus;
  readonly requestedActivationFlag: string | undefined;
  readonly requestedPublicLookupActivationFlag: string | undefined;
  readonly activationFlagPresent: boolean;
  readonly dryRunStatus: string;
  readonly dryRunPassed: boolean;
  readonly preflightStatus: string;
  readonly fakeRouteBoundAdapterCreatedInDryRun: boolean;
  readonly routeFlowSimulationPassed: boolean;
  readonly acknowledgeApiRouteOnlyActivation: boolean;
  readonly acknowledgeActualRouteHandlersRemainUnchanged: boolean;
  readonly apiRouteDatabaseBindingActivationReady: boolean;
  readonly actualRouteHandlersRemainMemoryDryRun: true;
  readonly actualRouteBindingApplied: false;
  readonly publicApiRoutesRemainMemoryDryRun: true;
  readonly publicResultPageLookupActivationAllowed: false;
  readonly publicResultPageLookupActivationSeparated: true;
  readonly productionMutationSmokeAllowed: false;
  readonly networkQueryExecuted: false;
  readonly persistentPublicLookupAllowed: false;
  readonly routeHandlerContextBlocked: boolean;
  readonly publicLookupContextBlocked: boolean;
  readonly publicLookupActivationFlagBlocked: boolean;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_RULES = [
  'activation-contract-requires-phase-8-11-preflight-and-phase-8-12-dry-run',
  'explicit-api-route-database-binding-activation-flag-is-required',
  'api-route-activation-decision-is-not-implementation',
  'actual-public-route-handler-resolver-remains-memory-dry-run',
  'public-r-public-id-page-lookup-activation-is-separate-and-blocked',
  'public-result-page-lookup-activation-flag-must-not-be-enabled-in-this-phase',
  'production-mutation-smoke-remains-blocked',
  'network-sql-execution-remains-blocked',
  'persistent-public-result-page-lookup-remains-blocked'
] as const;

export async function resolvePublicResultRouteDatabaseBindingActivationDecision(
  options: PublicResultRouteDatabaseBindingActivationOptions = {}
): Promise<PublicResultRouteDatabaseBindingActivationDecision> {
  const env = options.env ?? buildCompletePublicResultRouteDatabaseBindingActivationEnvironment();
  const context = options.context ?? 'unspecified';
  const requestedActivationFlag = env[PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV];
  const requestedPublicLookupActivationFlag = env[PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV];
  const activationFlagPresent = requestedActivationFlag === PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED;
  const publicLookupActivationFlagBlocked = requestedPublicLookupActivationFlag === PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENABLED;
  const acknowledgeApiRouteOnlyActivation = options.acknowledgeApiRouteOnlyActivation === true;
  const acknowledgeActualRouteHandlersRemainUnchanged = options.acknowledgeActualRouteHandlersRemainUnchanged === true;
  const routeHandlerContextBlocked = context === 'public-api-route-handler';
  const publicLookupContextBlocked = context === 'public-result-page-lookup';

  const dryRun = await runPublicResultRouteDatabaseBindingDryRun({
    env,
    context: 'route-binding-dry-run-contract',
    acknowledgeFakeExecutorOnly: true
  });

  const initialIssues = [
    ...(dryRun.status === 'route-database-binding-dry-run-passed' ? [] : [`route_database_binding_dry_run_required:${dryRun.status}`]),
    ...(activationFlagPresent ? [] : [`route_database_binding_activation_flag_required:${requestedActivationFlag ?? 'unset'}`]),
    ...(acknowledgeApiRouteOnlyActivation ? [] : ['api_route_only_activation_acknowledgement_required']),
    ...(acknowledgeActualRouteHandlersRemainUnchanged ? [] : ['actual_route_handlers_remain_unchanged_acknowledgement_required']),
    ...(context === 'route-binding-activation-contract' ? [] : [`route_binding_activation_contract_context_required:${context}`]),
    ...(routeHandlerContextBlocked ? ['public_api_route_handler_context_activation_blocked_until_implementation_phase'] : []),
    ...(publicLookupContextBlocked ? ['public_result_page_lookup_context_activation_blocked'] : []),
    ...(publicLookupActivationFlagBlocked ? ['public_result_page_lookup_activation_flag_blocked_in_phase_8_13'] : [])
  ];

  const apiRouteDatabaseBindingActivationReady = initialIssues.length === 0;

  return {
    schemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_PHASE,
    mode: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_MODE,
    preflightSchemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION,
    preflightPhase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE,
    dryRunSchemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION,
    dryRunPhase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE,
    routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE,
    context,
    status: apiRouteDatabaseBindingActivationReady
      ? 'api-route-database-binding-activation-ready-not-applied'
      : 'api-route-database-binding-activation-blocked',
    requestedActivationFlag,
    requestedPublicLookupActivationFlag,
    activationFlagPresent,
    dryRunStatus: dryRun.status,
    dryRunPassed: dryRun.status === 'route-database-binding-dry-run-passed',
    preflightStatus: dryRun.preflightStatus,
    fakeRouteBoundAdapterCreatedInDryRun: dryRun.fakeRouteBoundDatabaseAdapterCreated,
    routeFlowSimulationPassed: dryRun.routeHandlerCreateReadDeletePruneSimulationPassed,
    acknowledgeApiRouteOnlyActivation,
    acknowledgeActualRouteHandlersRemainUnchanged,
    apiRouteDatabaseBindingActivationReady,
    actualRouteHandlersRemainMemoryDryRun: true,
    actualRouteBindingApplied: false,
    publicApiRoutesRemainMemoryDryRun: true,
    publicResultPageLookupActivationAllowed: false,
    publicResultPageLookupActivationSeparated: true,
    productionMutationSmokeAllowed: false,
    networkQueryExecuted: false,
    persistentPublicLookupAllowed: false,
    routeHandlerContextBlocked,
    publicLookupContextBlocked,
    publicLookupActivationFlagBlocked,
    issues: initialIssues
  };
}

export function buildCompletePublicResultRouteDatabaseBindingActivationEnvironment(): PublicResultStorageRuntimeEnvironment {
  return {
    ...buildCompletePublicResultRouteDatabaseBindingDryRunEnvironment(),
    [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV]: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED
  };
}

export function summarizePublicResultRouteDatabaseBindingActivationRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_PHASE}`,
    `schema:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_MODE}`,
    `flag:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENV}=${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_ENABLED}`,
    `separate_page_lookup_flag:${PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV}`,
    ...PUBLIC_RESULT_ROUTE_DATABASE_BINDING_ACTIVATION_RULES
  ];
}
