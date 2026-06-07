import { buildPublicResultCreateRequestDto, buildPublicResultDeleteRequestDto } from './publicResultApi';
import {
  buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment,
  buildPublicResultApiRouteDatabaseBindingRollbackEnvironment,
  PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV,
  resolvePublicResultApiRouteDatabaseBindingImplementationDecision
} from './publicResultApiRouteDatabaseBindingImplementation';
import type {
  PublicResultDatabaseQueryExecutionResult,
  PublicResultDatabaseQueryExecutor,
  PublicResultDatabaseStorageAdapterRow
} from './publicResultDatabaseStorageAdapter';
import type { PublicResultDatabaseParameterizedQueryDescriptor, PublicResultDatabaseQueryIntentName } from './publicResultDatabaseClientQueryReadiness';
import { buildPublicResultDto } from './publicResultDto';
import {
  handlePublicResultCreateRouteBody,
  handlePublicResultDeleteRouteBody,
  handlePublicResultReadRoute
} from './publicResultRouteHandlers';
import {
  buildDefaultPublicResultExpiry,
  buildPublicResultDeleteTokenHash
} from './publicResultStorage';
import { runCorridorsEngine } from '../engine';

export const PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_SCHEMA_VERSION =
  'phase-8.15-database-route-rollback-failure-evidence-pack-v1' as const;
export const PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PHASE =
  'phase-8.15-database-route-rollback-failure-mode-evidence-pack' as const;
export const PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_MODE =
  'api-route-database-binding-operational-rollback-failure-evidence' as const;

export interface PublicResultDatabaseRouteRollbackFailureEvidenceReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PHASE;
  readonly mode: typeof PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_MODE;
  readonly defaultStatus: string;
  readonly rollbackStatus: string;
  readonly activeDatabaseStatus: string;
  readonly missingEnvStatus: string;
  readonly invalidEnvStatus: string;
  readonly partialActivationStatus: string;
  readonly publicLookupActivationStatus: string;
  readonly rollbackCreateStatus: number;
  readonly rollbackReadStatus: number;
  readonly rollbackDeleteStatus: number;
  readonly missingEnvCreateStatus: number;
  readonly invalidEnvCreateStatus: number;
  readonly partialActivationCreateStatus: number;
  readonly databaseUnavailableCreateStatus: number;
  readonly writeFailureCreateStatus: number;
  readonly readMissStatus: number;
  readonly deleteTokenMismatchStatus: number;
  readonly deleteFailureStatus: number;
  readonly publicLookupActivationAllowed: false;
  readonly productionMutationSmokeAllowed: false;
  readonly networkQueryExecuted: false;
  readonly rawDeleteTokenPersisted: false;
  readonly rawAnswersExposed: false;
  readonly rollbackEvidencePassed: boolean;
  readonly failClosedEvidencePassed: boolean;
  readonly failureModeEvidencePassed: boolean;
  readonly publicLookupStillBlocked: boolean;
  readonly executedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly uniqueExecutedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly failureModes: readonly string[];
  readonly issues: readonly string[];
}

const CREATED_AT = '2026-06-06T12:00:00.000Z';
const PUBLIC_ID = 'pub_8A15FailureEvidence123456';
const DELETE_TOKEN = 'delete_8A15FailureEvidence_123456789';
const WRONG_DELETE_TOKEN = 'delete_8A15WrongFailure_123456789';
const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';

export async function buildPublicResultDatabaseRouteRollbackFailureEvidenceReport(): Promise<PublicResultDatabaseRouteRollbackFailureEvidenceReport> {
  const completeEnv = buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment();
  const rollbackEnv = buildPublicResultApiRouteDatabaseBindingRollbackEnvironment();
  const defaultDecision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: {}, context: 'public-api-route-handler' });
  const rollbackDecision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: rollbackEnv, context: 'public-api-route-handler' });
  const activeDecision = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: completeEnv, context: 'public-api-route-handler' });
  const missingEnv = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: buildMissingDatabaseEnv(), context: 'public-api-route-handler' });
  const invalidEnv = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: buildInvalidDatabaseEnv(), context: 'public-api-route-handler' });
  const partialActivation = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: { PUBLIC_RESULT_STORAGE_MODE: 'database' }, context: 'public-api-route-handler' });
  const publicLookupActivation = resolvePublicResultApiRouteDatabaseBindingImplementationDecision({ env: { ...completeEnv, [PUBLIC_RESULT_PUBLIC_LOOKUP_DATABASE_ACTIVATION_ENV]: 'enabled' }, context: 'public-api-route-handler' });

  const rollbackFlow = await runRollbackFlow(rollbackEnv);
  const missingEnvCreate = await handlePublicResultCreateRouteBody(buildCreateBody(), { env: buildMissingDatabaseEnv(), nowIso: CREATED_AT });
  const invalidEnvCreate = await handlePublicResultCreateRouteBody(buildCreateBody(), { env: buildInvalidDatabaseEnv(), nowIso: CREATED_AT });
  const partialActivationCreate = await handlePublicResultCreateRouteBody(buildCreateBody(), { env: { PUBLIC_RESULT_STORAGE_MODE: 'database' }, nowIso: CREATED_AT });
  const unavailable = await handlePublicResultCreateRouteBody(buildCreateBody(), { env: completeEnv, nowIso: CREATED_AT, databaseExecuteQuery: createUnavailableExecutor().executeQuery });
  const writeFailure = await handlePublicResultCreateRouteBody(buildCreateBody(), { env: completeEnv, nowIso: CREATED_AT, databaseExecuteQuery: createWriteFailureExecutor().executeQuery });
  const readMissFake = createReadMissExecutor();
  const readMiss = await handlePublicResultReadRoute(PUBLIC_ID, { env: completeEnv, nowIso: CREATED_AT, databaseExecuteQuery: readMissFake.executeQuery });
  const mismatchFake = createPreloadedExecutor({ verifyMatches: false, deleteReturnsRow: true });
  const deleteMismatch = await handlePublicResultDeleteRouteBody(PUBLIC_ID, buildPublicResultDeleteRequestDto(PUBLIC_ID, WRONG_DELETE_TOKEN), { env: completeEnv, nowIso: CREATED_AT, databaseExecuteQuery: mismatchFake.executeQuery });
  const deleteFailureFake = createPreloadedExecutor({ verifyMatches: true, deleteReturnsRow: false });
  const deleteFailure = await handlePublicResultDeleteRouteBody(PUBLIC_ID, buildPublicResultDeleteRequestDto(PUBLIC_ID, DELETE_TOKEN), { env: completeEnv, nowIso: CREATED_AT, databaseExecuteQuery: deleteFailureFake.executeQuery });

  const executedQueryIntents = [
    ...readMissFake.executedQueryIntents(),
    ...mismatchFake.executedQueryIntents(),
    ...deleteFailureFake.executedQueryIntents()
  ];
  const uniqueExecutedQueryIntents = [...new Set(executedQueryIntents)] as PublicResultDatabaseQueryIntentName[];

  const rollbackEvidencePassed =
    rollbackDecision.status === 'memory-adapter-selected-rollback' &&
    rollbackFlow.createStatus === 201 &&
    rollbackFlow.readStatus === 200 &&
    rollbackFlow.deleteStatus === 200;
  const failClosedEvidencePassed =
    missingEnv.status === 'api-route-database-binding-implementation-blocked' &&
    invalidEnv.status === 'api-route-database-binding-implementation-blocked' &&
    partialActivation.status === 'api-route-database-binding-implementation-blocked' &&
    missingEnvCreate.status === 500 &&
    invalidEnvCreate.status === 500 &&
    partialActivationCreate.status === 500;
  const failureModeEvidencePassed =
    unavailable.status === 500 &&
    writeFailure.status === 500 &&
    readMiss.status === 404 &&
    deleteMismatch.status === 403 &&
    deleteFailure.status === 500;
  const publicLookupStillBlocked = publicLookupActivation.publicResultPageLookupActivationAllowed === false;

  const issues = [
    ...(defaultDecision.status === 'memory-adapter-selected-default' ? [] : [`default_memory_status_unexpected:${defaultDecision.status}`]),
    ...(activeDecision.status === 'database-adapter-selected-for-public-api-route' ? [] : [`active_database_status_unexpected:${activeDecision.status}`]),
    ...(rollbackEvidencePassed ? [] : ['rollback_evidence_failed']),
    ...(failClosedEvidencePassed ? [] : ['fail_closed_evidence_failed']),
    ...(failureModeEvidencePassed ? [] : ['failure_mode_evidence_failed']),
    ...(publicLookupStillBlocked ? [] : ['public_lookup_activation_not_blocked'])
  ];

  return {
    schemaVersion: PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_PHASE,
    mode: PUBLIC_RESULT_DATABASE_ROUTE_ROLLBACK_FAILURE_EVIDENCE_MODE,
    defaultStatus: defaultDecision.status,
    rollbackStatus: rollbackDecision.status,
    activeDatabaseStatus: activeDecision.status,
    missingEnvStatus: missingEnv.status,
    invalidEnvStatus: invalidEnv.status,
    partialActivationStatus: partialActivation.status,
    publicLookupActivationStatus: publicLookupActivation.status,
    rollbackCreateStatus: rollbackFlow.createStatus,
    rollbackReadStatus: rollbackFlow.readStatus,
    rollbackDeleteStatus: rollbackFlow.deleteStatus,
    missingEnvCreateStatus: missingEnvCreate.status,
    invalidEnvCreateStatus: invalidEnvCreate.status,
    partialActivationCreateStatus: partialActivationCreate.status,
    databaseUnavailableCreateStatus: unavailable.status,
    writeFailureCreateStatus: writeFailure.status,
    readMissStatus: readMiss.status,
    deleteTokenMismatchStatus: deleteMismatch.status,
    deleteFailureStatus: deleteFailure.status,
    publicLookupActivationAllowed: false,
    productionMutationSmokeAllowed: false,
    networkQueryExecuted: false,
    rawDeleteTokenPersisted: false,
    rawAnswersExposed: false,
    rollbackEvidencePassed,
    failClosedEvidencePassed,
    failureModeEvidencePassed,
    publicLookupStillBlocked,
    executedQueryIntents,
    uniqueExecutedQueryIntents,
    failureModes: [
      'missing-env-fails-closed',
      'invalid-env-fails-closed',
      'partial-activation-fails-closed',
      'database-unavailable-normalized-to-storage-unavailable',
      'write-failure-normalized-to-storage-unavailable',
      'read-miss-normalized-to-404',
      'delete-token-mismatch-normalized-to-403',
      'delete-failure-normalized-to-storage-unavailable'
    ],
    issues
  };
}

export function assertPublicResultDatabaseRouteRollbackFailureEvidencePassed(
  report: PublicResultDatabaseRouteRollbackFailureEvidenceReport
): asserts report is PublicResultDatabaseRouteRollbackFailureEvidenceReport & { readonly issues: [] } {
  if (report.issues.length > 0) {
    throw new Error(`Database route rollback/failure evidence failed: ${report.issues.join(', ')}`);
  }
}

function buildMissingDatabaseEnv() {
  const env = { ...buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment() };
  delete env.PUBLIC_RESULT_DATABASE_URL;
  return env;
}

function buildInvalidDatabaseEnv() {
  return {
    ...buildCompletePublicResultApiRouteDatabaseBindingImplementationEnvironment(),
    PUBLIC_RESULT_DATABASE_URL: 'not-a-valid-postgresql-url'
  };
}

async function runRollbackFlow(env: Record<string, string | undefined>) {
  const create = await handlePublicResultCreateRouteBody(buildCreateBody(), { env, nowIso: CREATED_AT });
  const read = await handlePublicResultReadRoute(PUBLIC_ID, { env, nowIso: CREATED_AT });
  const deleted = await handlePublicResultDeleteRouteBody(PUBLIC_ID, buildPublicResultDeleteRequestDto(PUBLIC_ID, DELETE_TOKEN), { env, nowIso: CREATED_AT });
  return { createStatus: create.status, readStatus: read.status, deleteStatus: deleted.status };
}

function buildCreateBody() {
  const expiresAt = buildDefaultPublicResultExpiry(CREATED_AT);
  const deleteTokenHash = buildPublicResultDeleteTokenHash(DELETE_TOKEN);
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), { resultId: PUBLIC_ID, createdAt: CREATED_AT, expiresAt, deleteTokenHash });
  return { ...buildPublicResultCreateRequestDto(dto, 'client_nonce_phase_8_15_failure_evidence_test'), deleteToken: DELETE_TOKEN };
}

function createUnavailableExecutor(): ExecutorHarness {
  const executed: PublicResultDatabaseQueryIntentName[] = [];
  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor) => {
    executed.push(descriptor.intentName);
    throw new Error('simulated database unavailable');
  };
  return { executeQuery, executedQueryIntents: () => [...executed] };
}

function createWriteFailureExecutor(): ExecutorHarness {
  const executed: PublicResultDatabaseQueryIntentName[] = [];
  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor) => {
    executed.push(descriptor.intentName);
    return emptyResult();
  };
  return { executeQuery, executedQueryIntents: () => [...executed] };
}

function createReadMissExecutor(): ExecutorHarness {
  const executed: PublicResultDatabaseQueryIntentName[] = [];
  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor) => {
    executed.push(descriptor.intentName);
    return emptyResult();
  };
  return { executeQuery, executedQueryIntents: () => [...executed] };
}

function createPreloadedExecutor(options: { readonly verifyMatches: boolean; readonly deleteReturnsRow: boolean }): ExecutorHarness {
  const executed: PublicResultDatabaseQueryIntentName[] = [];
  let row: PublicResultDatabaseStorageAdapterRow = buildPreloadedRow();
  const executeQuery: PublicResultDatabaseQueryExecutor = async (descriptor) => {
    executed.push(descriptor.intentName);
    if (descriptor.intentName === 'read-active-public-result-by-public-id') {
      return row.public_id === descriptor.values[0]
        ? { rows: [{ ...row, read_disposition: row.status }], rowCount: 1 }
        : emptyResult();
    }
    if (descriptor.intentName === 'verify-delete-token-hash-for-public-id') {
      return options.verifyMatches ? { rows: [row], rowCount: 1 } : emptyResult();
    }
    if (descriptor.intentName === 'soft-delete-public-result-by-public-id') {
      if (!options.deleteReturnsRow) return emptyResult();
      row = { ...row, status: 'deleted', deleted_at: String(valueByName(descriptor, 'deleted_at')), updated_at: String(valueByName(descriptor, 'updated_at')) };
      return { rows: [row], rowCount: 1 };
    }
    return emptyResult();
  };
  return { executeQuery, executedQueryIntents: () => [...executed] };
}

function buildPreloadedRow(): PublicResultDatabaseStorageAdapterRow {
  const body = buildCreateBody();
  return {
    schema_version: 'public-result-database-record-v1',
    public_id: body.dto.resultId,
    dto: body.dto,
    delete_token_hash: body.dto.deleteTokenHash,
    created_at: body.dto.createdAt,
    expires_at: body.dto.expiresAt,
    deleted_at: null,
    status: 'active',
    updated_at: body.dto.createdAt
  };
}

interface ExecutorHarness {
  readonly executeQuery: PublicResultDatabaseQueryExecutor;
  readonly executedQueryIntents: () => readonly PublicResultDatabaseQueryIntentName[];
}

function emptyResult(): PublicResultDatabaseQueryExecutionResult { return { rows: [], rowCount: 0 }; }

function valueByName(descriptor: PublicResultDatabaseParameterizedQueryDescriptor, name: string): unknown {
  const index = descriptor.parameterOrder.indexOf(name);
  if (index < 0) throw new Error(`Missing descriptor parameter: ${name}`);
  return descriptor.values[index];
}

