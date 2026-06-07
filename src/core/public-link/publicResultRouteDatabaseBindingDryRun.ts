import { runCorridorsEngine } from '../engine';
import {
  buildPublicResultCreateRequestDto,
  buildPublicResultDeleteRequestDto,
  PUBLIC_RESULT_API_SCHEMA_VERSION
} from './publicResultApi';
import { buildPublicResultDto, type PublicResultDto } from './publicResultDto';
import {
  handlePublicResultCreateRouteBody,
  handlePublicResultDeleteRouteBody,
  handlePublicResultReadRoute,
  PUBLIC_RESULT_ROUTE_HANDLERS_MODE
} from './publicResultRouteHandlers';
import {
  buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE,
  PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION,
  resolvePublicResultRouteDatabaseBindingPreflightDecision
} from './publicResultRouteDatabaseBindingPreflight';
import {
  createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation
} from './publicResultStorageAdapterFactoryActivation';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultDeleteTokenHash
} from './publicResultStorage';
import type {
  PublicResultDatabaseParameterizedQueryDescriptor,
  PublicResultDatabaseQueryIntentName
} from './publicResultDatabaseClientQueryReadiness';
import type {
  PublicResultDatabaseQueryExecutionResult,
  PublicResultDatabaseQueryExecutor,
  PublicResultDatabaseStorageAdapterRow
} from './publicResultDatabaseStorageAdapter';
import type { PublicResultStorageRuntimeEnvironment } from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION =
  'phase-8.12-public-route-database-binding-dry-run-contract-v1' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE =
  'phase-8.12-public-route-database-binding-dry-run-contract' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_MODE =
  'fake-executor-route-binding-dry-run-no-production-binding' as const;

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV =
  'PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN' as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENABLED = 'enabled' as const;

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ROUTE_BINDING_ALLOWED = false as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PRODUCTION_MUTATION_ALLOWED = false as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_NETWORK_QUERY_ALLOWED = false as const;
export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PERSISTENT_LOOKUP_ALLOWED = false as const;

export type PublicResultRouteDatabaseBindingDryRunContext =
  | 'route-binding-dry-run-contract'
  | 'public-api-route-handler'
  | 'unspecified';

export type PublicResultRouteDatabaseBindingDryRunStatus =
  | 'route-database-binding-dry-run-passed'
  | 'route-database-binding-dry-run-blocked';

export interface PublicResultRouteDatabaseBindingDryRunOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicResultRouteDatabaseBindingDryRunContext;
  readonly acknowledgeFakeExecutorOnly?: boolean;
  readonly nowIso?: string;
}

export interface PublicResultRouteDatabaseBindingDryRunReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE;
  readonly mode: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_MODE;
  readonly preflightSchemaVersion: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION;
  readonly preflightPhase: typeof PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE;
  readonly routeHandlerMode: typeof PUBLIC_RESULT_ROUTE_HANDLERS_MODE;
  readonly context: PublicResultRouteDatabaseBindingDryRunContext;
  readonly status: PublicResultRouteDatabaseBindingDryRunStatus;
  readonly preflightStatus: string;
  readonly dryRunFlagPresent: boolean;
  readonly preflightReady: boolean;
  readonly fakeExecutorOnlyAcknowledged: boolean;
  readonly fakeRouteBoundDatabaseAdapterCreated: boolean;
  readonly createStatusCode: number | null;
  readonly readStatusCode: number | null;
  readonly deleteStatusCode: number | null;
  readonly readAfterDeleteStatusCode: number | null;
  readonly pruneDeletedCount: number | null;
  readonly routeHandlerCreateReadDeletePruneSimulationPassed: boolean;
  readonly executedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly uniqueExecutedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly queryIntentExecutionCount: number;
  readonly fakeExecutorRowCountAfterPrune: number;
  readonly routeBindingAllowed: false;
  readonly routeHandlerBindingAllowed: false;
  readonly productionMutationSmokeAllowed: false;
  readonly networkQueryExecuted: false;
  readonly persistentPublicLookupAllowed: false;
  readonly actualPublicRouteHandlersRemainMemoryDryRun: true;
  readonly publicApiRoutesRemainMemoryDryRun: true;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_RULES = [
  'route-binding-dry-run-requires-phase-8-11-preflight-ready-state',
  'route-binding-dry-run-requires-explicit-dry-run-flag',
  'route-binding-dry-run-uses-fake-executor-only',
  'fake-route-bound-adapter-may-be-injected-into-route-handler-functions-for-simulation',
  'actual-public-route-adapter-resolver-remains-memory-dry-run',
  'no-production-database-mutation-smoke',
  'no-network-sql-execution',
  'no-persistent-public-result-lookup-route',
  'route-handler-context-remains-blocked-for-production-binding'
] as const;

const DRY_RUN_CREATED_AT = '2026-06-07T00:00:00.000Z';
const DRY_RUN_PUBLIC_ID = 'pub_Phase812RouteDryRunAbCdEfGh';
const DRY_RUN_DELETE_TOKEN = 'delete_Phase812RouteDryRun_abcdefghijklmnopqrstuvwxyz123456';
const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';

export async function runPublicResultRouteDatabaseBindingDryRun(
  options: PublicResultRouteDatabaseBindingDryRunOptions = {}
): Promise<PublicResultRouteDatabaseBindingDryRunReport> {
  const env = options.env ?? buildCompletePublicResultRouteDatabaseBindingDryRunEnvironment();
  const context = options.context ?? 'unspecified';
  const nowIso = options.nowIso ?? DRY_RUN_CREATED_AT;
  const dryRunFlagPresent = env[PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV] === PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENABLED;
  const fakeExecutorOnlyAcknowledged = options.acknowledgeFakeExecutorOnly === true;
  const routeHandlerContextBlocked = context === 'public-api-route-handler';
  const preflight = resolvePublicResultRouteDatabaseBindingPreflightDecision({
    env,
    context: 'preflight-contract',
    acknowledgeNoProductionRouteBinding: true
  });

  const initialIssues = [
    ...(preflight.preflightReady ? [] : preflight.issues.map((issue) => `preflight_not_ready:${issue}`)),
    ...(dryRunFlagPresent ? [] : [`route_database_binding_dry_run_flag_required:${env[PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV] ?? 'unset'}`]),
    ...(fakeExecutorOnlyAcknowledged ? [] : ['fake_executor_only_acknowledgement_required']),
    ...(context === 'route-binding-dry-run-contract' ? [] : [`route_binding_dry_run_contract_context_required:${context}`]),
    ...(routeHandlerContextBlocked ? ['public_api_route_handler_context_database_binding_dry_run_blocked'] : [])
  ];

  if (initialIssues.length > 0) {
    return buildBlockedDryRunReport({ context, preflightStatus: preflight.status, dryRunFlagPresent, fakeExecutorOnlyAcknowledged, preflightReady: preflight.preflightReady, issues: initialIssues });
  }

  const fakeExecutor = createRouteBindingDryRunFakeExecutor();
  const adapter = createPublicResultDatabaseAdapterForExplicitNonRouteFactoryActivation({
    env,
    context: 'explicit-non-route-database-activation',
    acknowledgeNoRouteBinding: true,
    executeQuery: fakeExecutor.executeQuery,
    nowIso: () => nowIso
  });

  const create = await handlePublicResultCreateRouteBody(buildRouteBindingDryRunCreateBody(nowIso), { adapter, nowIso });
  const read = await handlePublicResultReadRoute(DRY_RUN_PUBLIC_ID, { adapter, nowIso });
  const deleteResult = await handlePublicResultDeleteRouteBody(
    DRY_RUN_PUBLIC_ID,
    buildPublicResultDeleteRequestDto(DRY_RUN_PUBLIC_ID, DRY_RUN_DELETE_TOKEN),
    { adapter, nowIso }
  );
  const readAfterDelete = await handlePublicResultReadRoute(DRY_RUN_PUBLIC_ID, { adapter, nowIso });
  const prune = await adapter.pruneExpired(nowIso);

  const routeHandlerCreateReadDeletePruneSimulationPassed =
    create.status === 201 &&
    read.status === 200 &&
    deleteResult.status === 200 &&
    readAfterDelete.status === 410 &&
    prune.deletedCount === 1 &&
    fakeExecutor.rowCount() === 0;

  const simulationIssues = routeHandlerCreateReadDeletePruneSimulationPassed
    ? []
    : [
        `route_binding_dry_run_simulation_failed:create_${create.status}:read_${read.status}:delete_${deleteResult.status}:read_after_delete_${readAfterDelete.status}:prune_${prune.deletedCount}`
      ];

  const issues = [...initialIssues, ...simulationIssues];

  return {
    schemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE,
    mode: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_MODE,
    preflightSchemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION,
    preflightPhase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE,
    routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE,
    context,
    status: issues.length === 0 ? 'route-database-binding-dry-run-passed' : 'route-database-binding-dry-run-blocked',
    preflightStatus: preflight.status,
    dryRunFlagPresent,
    preflightReady: preflight.preflightReady,
    fakeExecutorOnlyAcknowledged,
    fakeRouteBoundDatabaseAdapterCreated: true,
    createStatusCode: create.status,
    readStatusCode: read.status,
    deleteStatusCode: deleteResult.status,
    readAfterDeleteStatusCode: readAfterDelete.status,
    pruneDeletedCount: prune.deletedCount,
    routeHandlerCreateReadDeletePruneSimulationPassed,
    executedQueryIntents: fakeExecutor.executedQueryIntents(),
    uniqueExecutedQueryIntents: unique(fakeExecutor.executedQueryIntents()),
    queryIntentExecutionCount: fakeExecutor.executedQueryIntents().length,
    fakeExecutorRowCountAfterPrune: fakeExecutor.rowCount(),
    routeBindingAllowed: false,
    routeHandlerBindingAllowed: false,
    productionMutationSmokeAllowed: false,
    networkQueryExecuted: false,
    persistentPublicLookupAllowed: false,
    actualPublicRouteHandlersRemainMemoryDryRun: true,
    publicApiRoutesRemainMemoryDryRun: true,
    issues
  };
}

export function buildCompletePublicResultRouteDatabaseBindingDryRunEnvironment(): PublicResultStorageRuntimeEnvironment {
  return {
    ...buildCompletePublicResultRouteDatabaseBindingPreflightEnvironment(),
    [PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV]: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENABLED
  };
}

export function summarizePublicResultRouteDatabaseBindingDryRunRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE}`,
    `schema:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_MODE}`,
    `flag:${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENV}=${PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_ENABLED}`,
    ...PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_RULES
  ];
}

function buildRouteBindingDryRunCreateBody(createdAt: string) {
  const expiresAt = buildDefaultPublicResultExpiry(createdAt);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(DRY_RUN_DELETE_TOKEN);
  const dto = buildRouteBindingDryRunDto({ createdAt, expiresAt, deleteTokenHash });
  return { ...buildPublicResultCreateRequestDto(dto, 'client_nonce_phase_8_12_route_binding_dry_run'), deleteToken: DRY_RUN_DELETE_TOKEN };
}

function buildRouteBindingDryRunDto(input: {
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly deleteTokenHash: string;
}): PublicResultDto {
  return buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), {
    resultId: DRY_RUN_PUBLIC_ID,
    createdAt: input.createdAt,
    expiresAt: input.expiresAt,
    deleteTokenHash: input.deleteTokenHash
  });
}

function createRouteBindingDryRunFakeExecutor(): {
  readonly executeQuery: PublicResultDatabaseQueryExecutor;
  readonly executedQueryIntents: () => readonly PublicResultDatabaseQueryIntentName[];
  readonly rowCount: () => number;
} {
  let row: PublicResultDatabaseStorageAdapterRow | null = null;
  const executed: PublicResultDatabaseQueryIntentName[] = [];

  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor) => {
    executed.push(descriptor.intentName);

    if (descriptor.intentName === 'insert-public-result-record') {
      const insertedRow = rowFromInsertDescriptor(descriptor);
      row = insertedRow;
      return { rows: [insertedRow], rowCount: 1 };
    }

    if (descriptor.intentName === 'read-active-public-result-by-public-id') {
      const publicId = descriptor.values[0];
      if (row === null || row.public_id !== publicId) return { rows: [], rowCount: 0 };
      return { rows: [withReadDisposition(row)], rowCount: 1 };
    }

    if (descriptor.intentName === 'verify-delete-token-hash-for-public-id') {
      const [publicId, deleteTokenHash] = descriptor.values;
      const currentRow = row;
      const matched = currentRow !== null && currentRow.public_id === publicId && currentRow.delete_token_hash === deleteTokenHash && currentRow.deleted_at === null;
      return matched ? { rows: [currentRow], rowCount: 1 } : { rows: [], rowCount: 0 };
    }

    if (descriptor.intentName === 'soft-delete-public-result-by-public-id') {
      const [publicId, deleteTokenHash, deletedAtIso, updatedAtIso] = descriptor.values;
      const matched = row !== null && row.public_id === publicId && row.delete_token_hash === deleteTokenHash && row.deleted_at === null;
      if (!matched || row === null) return { rows: [], rowCount: 0 };
      const deletedRow: PublicResultDatabaseStorageAdapterRow = {
        ...row,
        deleted_at: String(deletedAtIso),
        updated_at: String(updatedAtIso),
        status: 'deleted'
      };
      row = deletedRow;
      return { rows: [deletedRow], rowCount: 1 };
    }

    if (descriptor.intentName === 'mark-expired-public-results') {
      const [nowIso, updatedAtIso] = descriptor.values;
      if (row !== null && row.status === 'active' && row.deleted_at === null && new Date(String(row.expires_at)).getTime() <= new Date(String(nowIso)).getTime()) {
        const expiredRow: PublicResultDatabaseStorageAdapterRow = { ...row, status: 'expired', updated_at: String(updatedAtIso) };
        row = expiredRow;
        return { rows: [expiredRow], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    if (descriptor.intentName === 'prune-deleted-or-expired-public-results') {
      if (row !== null && (row.status === 'deleted' || row.status === 'expired')) {
        const deletedRow = row;
        row = null;
        return { rows: [deletedRow], rowCount: 1 };
      }
      return { rows: [], rowCount: 0 };
    }

    return { rows: [], rowCount: 0 } satisfies PublicResultDatabaseQueryExecutionResult;
  };

  return {
    executeQuery,
    executedQueryIntents: () => [...executed],
    rowCount: () => (row === null ? 0 : 1)
  };
}

function rowFromInsertDescriptor(descriptor: PublicResultDatabaseParameterizedQueryDescriptor): PublicResultDatabaseStorageAdapterRow {
  return {
    schema_version: String(valueByName(descriptor, 'schema_version')),
    public_id: String(valueByName(descriptor, 'public_id')),
    dto: valueByName(descriptor, 'dto'),
    delete_token_hash: String(valueByName(descriptor, 'delete_token_hash')),
    created_at: String(valueByName(descriptor, 'created_at')),
    expires_at: String(valueByName(descriptor, 'expires_at')),
    deleted_at: valueByName(descriptor, 'deleted_at') === null ? null : String(valueByName(descriptor, 'deleted_at')),
    status: 'active',
    updated_at: String(valueByName(descriptor, 'updated_at'))
  };
}

function valueByName(descriptor: PublicResultDatabaseParameterizedQueryDescriptor, name: string): unknown {
  const index = descriptor.parameterOrder.indexOf(name);
  if (index < 0) throw new Error(`Missing descriptor parameter: ${name}`);
  return descriptor.values[index];
}

function withReadDisposition(row: PublicResultDatabaseStorageAdapterRow): PublicResultDatabaseStorageAdapterRow {
  if (row.deleted_at !== null || row.status === 'deleted') return { ...row, read_disposition: 'deleted' };
  if (new Date(String(row.expires_at)).getTime() <= new Date(DRY_RUN_CREATED_AT).getTime()) {
    return { ...row, read_disposition: 'expired' };
  }
  return { ...row, read_disposition: row.status };
}

function buildBlockedDryRunReport(input: {
  readonly context: PublicResultRouteDatabaseBindingDryRunContext;
  readonly preflightStatus: string;
  readonly dryRunFlagPresent: boolean;
  readonly fakeExecutorOnlyAcknowledged: boolean;
  readonly preflightReady: boolean;
  readonly issues: readonly string[];
}): PublicResultRouteDatabaseBindingDryRunReport {
  return {
    schemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_PHASE,
    mode: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_DRY_RUN_MODE,
    preflightSchemaVersion: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_SCHEMA_VERSION,
    preflightPhase: PUBLIC_RESULT_ROUTE_DATABASE_BINDING_PREFLIGHT_PHASE,
    routeHandlerMode: PUBLIC_RESULT_ROUTE_HANDLERS_MODE,
    context: input.context,
    status: 'route-database-binding-dry-run-blocked',
    preflightStatus: input.preflightStatus,
    dryRunFlagPresent: input.dryRunFlagPresent,
    preflightReady: input.preflightReady,
    fakeExecutorOnlyAcknowledged: input.fakeExecutorOnlyAcknowledged,
    fakeRouteBoundDatabaseAdapterCreated: false,
    createStatusCode: null,
    readStatusCode: null,
    deleteStatusCode: null,
    readAfterDeleteStatusCode: null,
    pruneDeletedCount: null,
    routeHandlerCreateReadDeletePruneSimulationPassed: false,
    executedQueryIntents: [],
    uniqueExecutedQueryIntents: [],
    queryIntentExecutionCount: 0,
    fakeExecutorRowCountAfterPrune: 0,
    routeBindingAllowed: false,
    routeHandlerBindingAllowed: false,
    productionMutationSmokeAllowed: false,
    networkQueryExecuted: false,
    persistentPublicLookupAllowed: false,
    actualPublicRouteHandlersRemainMemoryDryRun: true,
    publicApiRoutesRemainMemoryDryRun: true,
    issues: input.issues
  };
}

function unique(values: readonly PublicResultDatabaseQueryIntentName[]): readonly PublicResultDatabaseQueryIntentName[] {
  return [...new Set(values)];
}
