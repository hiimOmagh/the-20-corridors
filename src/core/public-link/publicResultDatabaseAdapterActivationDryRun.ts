import { runCorridorsEngine } from '../engine';
import { buildPublicResultDto } from './publicResultDto';
import { buildCompleteDatabaseClientSmokeEnvironment } from './publicResultDatabaseClientSmokeBoundary';
import {
  PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_FACTORY_BINDING_ALLOWED,
  PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE,
  PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_PRODUCTION_SMOKE_ALLOWED,
  PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_ROUTE_BINDING_ALLOWED,
  buildDatabaseStorageAdapterImplementationSampleRow,
  createPublicResultDatabaseStorageAdapterImplementation,
  type PublicResultDatabaseQueryExecutionResult,
  type PublicResultDatabaseQueryExecutor,
  type PublicResultDatabaseStorageAdapterRow
} from './publicResultDatabaseStorageAdapter';
import type { PublicResultDatabaseQueryIntentName } from './publicResultDatabaseClientQueryReadiness';
import { resolvePublicResultStorageAdapterFactoryDecision } from './publicResultStorageAdapterFactory';
import { buildDefaultPublicResultExpiry, buildPublicResultDeleteTokenHash } from './publicResultStorage';

export const PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_SCHEMA_VERSION =
  'phase-8.9-database-adapter-activation-dry-run-gate-v1' as const;
export const PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_PHASE =
  'phase-8.9-database-adapter-activation-dry-run-gate' as const;
export const PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_MODE =
  'activation-simulation-only-no-route-binding' as const;

export type PublicResultDatabaseAdapterActivationDryRunStatus =
  | 'database-adapter-selected-dry-run'
  | 'blocked';

export interface PublicResultDatabaseAdapterActivationDryRunResult {
  readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_PHASE;
  readonly mode: typeof PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_MODE;
  readonly status: PublicResultDatabaseAdapterActivationDryRunStatus;
  readonly adapterImplementationPhase: typeof PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE;
  readonly requestedFactoryStatus: string;
  readonly requestedFactoryAdapterKind: string;
  readonly factoryDatabaseAdapterCreated: false;
  readonly factoryRouteBindingAllowed: false;
  readonly routeBindingAllowed: false;
  readonly productionMutationSmokeAllowed: false;
  readonly networkQueryExecuted: false;
  readonly sqlMutationExecuted: false;
  readonly dryRunAdapterCreated: boolean;
  readonly dryRunExecutorUsed: boolean;
  readonly createStatus: string;
  readonly readStatus: string;
  readonly deleteStatus: string;
  readonly pruneDeletedCount: number;
  readonly observedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly uniqueObservedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly expectedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly missingQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly issues: readonly string[];
}

const createdAt = '2026-06-06T12:00:00.000Z';
const publicId = 'pub_Phase89ActivationDryRun7Kf9sQ2mN8xR4vB';
const deleteToken = 'delete_Phase89ActivationDryRun7Kf9sQ2mN8xR4vB_123456789';
const deleteTokenHash = buildPublicResultDeleteTokenHash(deleteToken);
const expiresAt = buildDefaultPublicResultExpiry(createdAt);
const dto = buildPublicResultDto(runCorridorsEngine('1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D'), {
  resultId: publicId,
  createdAt,
  expiresAt,
  deleteTokenHash
});
const input = { publicId, dto, createdAt, expiresAt, deleteTokenHash };

const EXPECTED_QUERY_INTENTS = [
  'insert-public-result-record',
  'read-active-public-result-by-public-id',
  'verify-delete-token-hash-for-public-id',
  'soft-delete-public-result-by-public-id',
  'mark-expired-public-results',
  'prune-deleted-or-expired-public-results'
] as const satisfies readonly PublicResultDatabaseQueryIntentName[];

export async function runPublicResultDatabaseAdapterActivationDryRun(): Promise<PublicResultDatabaseAdapterActivationDryRunResult> {
  const env = buildCompleteDatabaseClientSmokeEnvironment();
  const factoryDecision = resolvePublicResultStorageAdapterFactoryDecision({ env, purpose: 'contract-check' });
  const activeRow = buildDatabaseStorageAdapterImplementationSampleRow(input, createdAt);
  const deletedRow: PublicResultDatabaseStorageAdapterRow = {
    ...activeRow,
    deleted_at: createdAt,
    status: 'deleted'
  };
  const observedQueryIntents: PublicResultDatabaseQueryIntentName[] = [];
  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor): Promise<PublicResultDatabaseQueryExecutionResult> => {
    observedQueryIntents.push(descriptor.intentName);
    if (!descriptor.parameterized || descriptor.placeholderCount !== descriptor.valueCount) {
      throw new Error(`Activation dry-run query descriptor is not parameterized correctly: ${descriptor.intentName}`);
    }

    switch (descriptor.intentName) {
      case 'insert-public-result-record':
      case 'read-active-public-result-by-public-id':
      case 'verify-delete-token-hash-for-public-id':
        return { rows: [activeRow], rowCount: 1 };
      case 'soft-delete-public-result-by-public-id':
        return { rows: [deletedRow], rowCount: 1 };
      case 'mark-expired-public-results':
        return { rows: [activeRow], rowCount: 1 };
      case 'prune-deleted-or-expired-public-results':
        return { rows: [deletedRow], rowCount: 1 };
      default:
        return { rows: [], rowCount: 0 };
    }
  };

  const adapter = createPublicResultDatabaseStorageAdapterImplementation({ executeQuery, nowIso: () => createdAt });
  const created = await adapter.create(input);
  const read = await adapter.read(publicId);
  const deleted = await adapter.delete({ publicId, deleteToken });
  const pruned = await adapter.pruneExpired(createdAt);
  const uniqueObservedQueryIntents = Array.from(new Set(observedQueryIntents));
  const missingQueryIntents = EXPECTED_QUERY_INTENTS.filter((intent) => !uniqueObservedQueryIntents.includes(intent));
  const issues = [
    ...(factoryDecision.databaseAdapterCreated ? ['factory_database_adapter_created_during_dry_run'] : []),
    ...(factoryDecision.routeBindingAllowed ? ['factory_route_binding_allowed_during_dry_run'] : []),
    ...(PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_ROUTE_BINDING_ALLOWED ? ['adapter_route_binding_allowed'] : []),
    ...(PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_FACTORY_BINDING_ALLOWED ? ['adapter_factory_binding_allowed'] : []),
    ...(PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_PRODUCTION_SMOKE_ALLOWED ? ['production_mutation_smoke_allowed'] : []),
    ...missingQueryIntents.map((intent) => `missing_query_intent:${intent}`),
    ...(created.status === 'active' ? [] : [`unexpected_create_status:${created.status}`]),
    ...(read.status === 'active' ? [] : [`unexpected_read_status:${read.status}`]),
    ...(deleted.status === 'deleted' ? [] : [`unexpected_delete_status:${deleted.status}`]),
    ...(pruned.deletedCount === 1 ? [] : [`unexpected_prune_deleted_count:${pruned.deletedCount}`])
  ];

  return {
    schemaVersion: PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_PHASE,
    mode: PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_MODE,
    status: issues.length === 0 ? 'database-adapter-selected-dry-run' : 'blocked',
    adapterImplementationPhase: PUBLIC_RESULT_DATABASE_STORAGE_ADAPTER_IMPLEMENTATION_PHASE,
    requestedFactoryStatus: factoryDecision.status,
    requestedFactoryAdapterKind: factoryDecision.adapterKind,
    factoryDatabaseAdapterCreated: false,
    factoryRouteBindingAllowed: false,
    routeBindingAllowed: false,
    productionMutationSmokeAllowed: false,
    networkQueryExecuted: false,
    sqlMutationExecuted: false,
    dryRunAdapterCreated: true,
    dryRunExecutorUsed: true,
    createStatus: created.status,
    readStatus: read.status,
    deleteStatus: deleted.status,
    pruneDeletedCount: pruned.deletedCount,
    observedQueryIntents,
    uniqueObservedQueryIntents,
    expectedQueryIntents: EXPECTED_QUERY_INTENTS,
    missingQueryIntents,
    issues
  };
}

export function summarizePublicResultDatabaseAdapterActivationDryRunRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_PHASE}`,
    `schema:${PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_SCHEMA_VERSION}`,
    `mode:${PUBLIC_RESULT_DATABASE_ADAPTER_ACTIVATION_DRY_RUN_MODE}`,
    'database-adapter-can-be-selected-in-controlled-simulation',
    'factory-route-binding-remains-disabled',
    'route-handlers-remain-memory-dry-run',
    'no-production-mutation-smoke',
    'no-network-query-execution',
    'no-persistent-public-result-lookup-route'
  ];
}
