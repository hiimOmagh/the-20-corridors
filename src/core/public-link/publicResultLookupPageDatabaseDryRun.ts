import { runCorridorsEngine } from '../engine';
import { buildPublicResultDto, type PublicResultDto } from './publicResultDto';
import {
  buildCompletePublicResultLookupPageDatabasePreflightEnvironment,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE,
  PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION,
  resolvePublicResultLookupPageDatabasePreflightDecision
} from './publicResultLookupPageDatabasePreflight';
import {
  buildDatabaseStorageAdapterImplementationSampleRow,
  createPublicResultDatabaseStorageAdapterImplementation,
  type PublicResultDatabaseQueryExecutionResult,
  type PublicResultDatabaseQueryExecutor,
  type PublicResultDatabaseStorageAdapterRow
} from './publicResultDatabaseStorageAdapter';
import type {
  PublicResultDatabaseParameterizedQueryDescriptor,
  PublicResultDatabaseQueryIntentName
} from './publicResultDatabaseClientQueryReadiness';
import {
  buildPublicResultDeleteTokenHash,
  type PublicResultStorageAdapter,
  type PublicResultStorageCreateInput,
  type PublicResultStorageStatus
} from './publicResultStorage';
import type { PublicResultStorageRuntimeEnvironment } from './publicResultStorageRuntimeSelection';

export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION =
  'phase-8.17-public-result-lookup-page-dry-run-contract-v1' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE =
  'phase-8.17-public-result-lookup-page-dry-run-contract' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_MODE =
  'fake-executor-public-result-lookup-page-dry-run-no-route-activation' as const;

export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV = 'PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN' as const;
export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENABLED = 'enabled' as const;

export type PublicResultLookupPageDatabaseDryRunContext =
  | 'public-result-lookup-page-dry-run-contract'
  | 'public-result-page'
  | 'unspecified';

export type PublicResultLookupPageDatabaseDryRunStatus =
  | 'public-result-lookup-page-dry-run-passed'
  | 'public-result-lookup-page-dry-run-blocked';

export type PublicResultLookupPageDryRunViewStatus =
  | 'renderable'
  | 'not-found'
  | 'deleted-unavailable'
  | 'expired-unavailable';

export interface PublicResultLookupPageDatabaseDryRunOptions {
  readonly env?: PublicResultStorageRuntimeEnvironment;
  readonly context?: PublicResultLookupPageDatabaseDryRunContext;
  readonly acknowledgeFakeExecutorOnly?: boolean;
  readonly acknowledgeActualPageLookupRemainsDisabled?: boolean;
  readonly nowIso?: string;
}

export interface PublicResultLookupPageDryRunView {
  readonly publicId: string;
  readonly viewStatus: PublicResultLookupPageDryRunViewStatus;
  readonly storageStatus: PublicResultStorageStatus | 'not-found';
  readonly httpStatus: 200 | 404 | 410;
  readonly dto: PublicResultDto | null;
  readonly databaseReadExecuted: true;
  readonly networkQueryExecuted: false;
  readonly rawDeleteTokenExposed: false;
  readonly rawAnswersExposed: false;
}

export interface PublicResultLookupPageDatabaseDryRunReport {
  readonly schemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION;
  readonly phase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE;
  readonly mode: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_MODE;
  readonly preflightSchemaVersion: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION;
  readonly preflightPhase: typeof PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE;
  readonly context: PublicResultLookupPageDatabaseDryRunContext;
  readonly status: PublicResultLookupPageDatabaseDryRunStatus;
  readonly preflightStatus: string;
  readonly dryRunFlagPresent: boolean;
  readonly preflightReady: boolean;
  readonly fakeExecutorOnlyAcknowledged: boolean;
  readonly actualPageLookupDisabledAcknowledged: boolean;
  readonly fakeLookupAdapterCreated: boolean;
  readonly activeLookup: PublicResultLookupPageDryRunView | null;
  readonly readMissLookup: PublicResultLookupPageDryRunView | null;
  readonly deletedLookup: PublicResultLookupPageDryRunView | null;
  readonly expiredLookup: PublicResultLookupPageDryRunView | null;
  readonly lookupSimulationPassed: boolean;
  readonly executedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly uniqueExecutedQueryIntents: readonly PublicResultDatabaseQueryIntentName[];
  readonly queryIntentExecutionCount: number;
  readonly fakeExecutorRowCount: number;
  readonly actualPublicLookupPageBindingApplied: false;
  readonly realPublicResultPageDatabaseReadAllowed: false;
  readonly realPublicResultPageDatabaseReadExecuted: false;
  readonly productionNetworkLookupSmokeAllowed: false;
  readonly networkQueryExecuted: false;
  readonly productionMutationSmokeAllowed: false;
  readonly persistentPublicLookupRoutePresent: false;
  readonly apiRouteDatabaseBindingRemainsSeparate: true;
  readonly rawDeleteTokenExposed: false;
  readonly rawAnswersExposed: false;
  readonly issues: readonly string[];
}

export const PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_RULES = [
  'public-lookup-page-dry-run-requires-phase-8-16-preflight-ready-state',
  'public-lookup-page-dry-run-requires-explicit-dry-run-flag',
  'public-lookup-page-dry-run-uses-fake-executor-only',
  'fake-lookup-adapter-may-read-active-public-dto-by-public-id',
  'read-miss-renders-not-found-behavior',
  'deleted-result-renders-unavailable-behavior-without-dto',
  'expired-result-renders-expired-behavior-without-dto',
  'actual-public-r-public-id-page-lookup-remains-disabled',
  'no-production-network-lookup-smoke',
  'no-persistent-public-lookup-route-activation'
] as const;

const DRY_RUN_NOW = '2026-06-07T00:00:00.000Z';
const ACTIVE_PUBLIC_ID = 'pub_Phase817LookupActiveAbCdEfGh';
const MISSING_PUBLIC_ID = 'pub_Phase817LookupMissingBcDeFgHi';
const DELETED_PUBLIC_ID = 'pub_Phase817LookupDeletedCdEfGhIj';
const EXPIRED_PUBLIC_ID = 'pub_Phase817LookupExpiredDeFgHiJk';
const ACTIVE_CREATED_AT = '2026-06-01T00:00:00.000Z';
const ACTIVE_EXPIRES_AT = '2026-07-01T00:00:00.000Z';
const EXPIRED_CREATED_AT = '2026-04-01T00:00:00.000Z';
const EXPIRED_EXPIRES_AT = '2026-05-01T00:00:00.000Z';
const DELETE_TOKEN = 'delete_Phase817LookupDryRun_abcdefghijklmnopqrstuvwxyz123456';
const SAMPLE_ANSWERS = '1D 2B 3B 4A 5D 6B 7B 8D 9C 10B 11A 12D 13C 14A 15A 16D 17A 18B 19D 20D';

export async function runPublicResultLookupPageDatabaseDryRun(
  options: PublicResultLookupPageDatabaseDryRunOptions = {}
): Promise<PublicResultLookupPageDatabaseDryRunReport> {
  const env = options.env ?? buildCompletePublicResultLookupPageDatabaseDryRunEnvironment();
  const context = options.context ?? 'unspecified';
  const nowIso = options.nowIso ?? DRY_RUN_NOW;
  const dryRunFlagPresent = env[PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV] === PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENABLED;
  const fakeExecutorOnlyAcknowledged = options.acknowledgeFakeExecutorOnly === true;
  const actualPageLookupDisabledAcknowledged = options.acknowledgeActualPageLookupRemainsDisabled === true;

  const preflightDecision = resolvePublicResultLookupPageDatabasePreflightDecision({
    env: withoutDryRunFlag(env),
    context: 'public-result-lookup-page-preflight',
    acknowledgeApiRouteBindingDoesNotActivatePublicLookup: true,
    acknowledgePublicLookupRemainsDisabled: true,
    acknowledgeNoPublicPageDatabaseRead: true
  });
  const preflightReady = preflightDecision.status === 'public-result-lookup-page-preflight-ready-but-disabled';

  const issues = [
    ...(preflightReady ? [] : [`public_lookup_page_preflight_required:${preflightDecision.status}`]),
    ...(dryRunFlagPresent ? [] : [`public_lookup_page_database_dry_run_flag_required:${env[PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV] ?? 'unset'}`]),
    ...(fakeExecutorOnlyAcknowledged ? [] : ['fake_executor_only_acknowledgement_required']),
    ...(actualPageLookupDisabledAcknowledged ? [] : ['actual_public_lookup_page_remains_disabled_acknowledgement_required']),
    ...(context === 'public-result-lookup-page-dry-run-contract'
      ? []
      : [`public_result_lookup_page_dry_run_context_required:${context}`]),
    ...(context === 'public-result-page' ? ['public_result_page_context_blocked_until_lookup_page_activation_phase'] : [])
  ];

  let activeLookup: PublicResultLookupPageDryRunView | null = null;
  let readMissLookup: PublicResultLookupPageDryRunView | null = null;
  let deletedLookup: PublicResultLookupPageDryRunView | null = null;
  let expiredLookup: PublicResultLookupPageDryRunView | null = null;
  let fakeExecutor: PublicResultLookupPageDryRunFakeExecutor | null = null;

  if (issues.length === 0) {
    fakeExecutor = createPublicResultLookupPageDryRunFakeExecutor(nowIso);
    const adapter = createPublicResultDatabaseStorageAdapterImplementation({
      executeQuery: fakeExecutor.execute,
      nowIso: () => nowIso
    });
    activeLookup = await resolvePublicResultLookupPageDryRunView({ adapter, publicId: ACTIVE_PUBLIC_ID });
    readMissLookup = await resolvePublicResultLookupPageDryRunView({ adapter, publicId: MISSING_PUBLIC_ID });
    deletedLookup = await resolvePublicResultLookupPageDryRunView({ adapter, publicId: DELETED_PUBLIC_ID });
    expiredLookup = await resolvePublicResultLookupPageDryRunView({ adapter, publicId: EXPIRED_PUBLIC_ID });
  }

  const lookupSimulationPassed =
    activeLookup?.viewStatus === 'renderable' &&
    activeLookup.httpStatus === 200 &&
    activeLookup.dto?.resultId === ACTIVE_PUBLIC_ID &&
    readMissLookup?.viewStatus === 'not-found' &&
    readMissLookup.httpStatus === 404 &&
    readMissLookup.dto === null &&
    deletedLookup?.viewStatus === 'deleted-unavailable' &&
    deletedLookup.httpStatus === 410 &&
    deletedLookup.dto === null &&
    expiredLookup?.viewStatus === 'expired-unavailable' &&
    expiredLookup.httpStatus === 410 &&
    expiredLookup.dto === null;

  const executedQueryIntents = fakeExecutor?.executedQueryIntents() ?? [];

  return {
    schemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION,
    phase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE,
    mode: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_MODE,
    preflightSchemaVersion: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_SCHEMA_VERSION,
    preflightPhase: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_PREFLIGHT_PHASE,
    context,
    status: issues.length === 0 && lookupSimulationPassed
      ? 'public-result-lookup-page-dry-run-passed'
      : 'public-result-lookup-page-dry-run-blocked',
    preflightStatus: preflightDecision.status,
    dryRunFlagPresent,
    preflightReady,
    fakeExecutorOnlyAcknowledged,
    actualPageLookupDisabledAcknowledged,
    fakeLookupAdapterCreated: fakeExecutor !== null,
    activeLookup,
    readMissLookup,
    deletedLookup,
    expiredLookup,
    lookupSimulationPassed,
    executedQueryIntents,
    uniqueExecutedQueryIntents: unique(executedQueryIntents),
    queryIntentExecutionCount: executedQueryIntents.length,
    fakeExecutorRowCount: fakeExecutor?.rowCount() ?? 0,
    actualPublicLookupPageBindingApplied: false,
    realPublicResultPageDatabaseReadAllowed: false,
    realPublicResultPageDatabaseReadExecuted: false,
    productionNetworkLookupSmokeAllowed: false,
    networkQueryExecuted: false,
    productionMutationSmokeAllowed: false,
    persistentPublicLookupRoutePresent: false,
    apiRouteDatabaseBindingRemainsSeparate: true,
    rawDeleteTokenExposed: false,
    rawAnswersExposed: false,
    issues: lookupSimulationPassed || issues.length > 0 ? issues : [...issues, 'lookup_page_dry_run_simulation_failed']
  };
}

export async function resolvePublicResultLookupPageDryRunView(input: {
  readonly adapter: PublicResultStorageAdapter;
  readonly publicId: string;
}): Promise<PublicResultLookupPageDryRunView> {
  const readResult = await input.adapter.read(input.publicId);

  if (readResult.status === 'not-found' || readResult.record === null) {
    return buildLookupView(input.publicId, 'not-found', 'not-found', 404, null);
  }

  if (readResult.status === 'deleted') {
    return buildLookupView(input.publicId, 'deleted-unavailable', 'deleted', 410, null);
  }

  if (readResult.status === 'expired') {
    return buildLookupView(input.publicId, 'expired-unavailable', 'expired', 410, null);
  }

  return buildLookupView(input.publicId, 'renderable', 'active', 200, readResult.record.dto);
}

export function buildCompletePublicResultLookupPageDatabaseDryRunEnvironment(): PublicResultStorageRuntimeEnvironment {
  return {
    ...buildCompletePublicResultLookupPageDatabasePreflightEnvironment(),
    [PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV]: PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENABLED
  };
}

export function summarizePublicResultLookupPageDatabaseDryRunRules(): readonly string[] {
  return [
    `phase:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_PHASE}`,
    `schema:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_SCHEMA_VERSION}`,
    `flag:${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV}=${PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENABLED}`,
    ...PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_RULES
  ];
}

function buildLookupView(
  publicId: string,
  viewStatus: PublicResultLookupPageDryRunViewStatus,
  storageStatus: PublicResultStorageStatus | 'not-found',
  httpStatus: 200 | 404 | 410,
  dto: PublicResultDto | null
): PublicResultLookupPageDryRunView {
  return {
    publicId,
    viewStatus,
    storageStatus,
    httpStatus,
    dto,
    databaseReadExecuted: true,
    networkQueryExecuted: false,
    rawDeleteTokenExposed: false,
    rawAnswersExposed: false
  };
}

function createPublicResultLookupPageDryRunFakeExecutor(nowIso: string): PublicResultLookupPageDryRunFakeExecutor {
  const rows = new Map<string, PublicResultDatabaseStorageAdapterRow>();
  rows.set(ACTIVE_PUBLIC_ID, buildSampleRow(ACTIVE_PUBLIC_ID, ACTIVE_CREATED_AT, ACTIVE_EXPIRES_AT, 'active', null, nowIso));
  rows.set(DELETED_PUBLIC_ID, buildSampleRow(DELETED_PUBLIC_ID, ACTIVE_CREATED_AT, ACTIVE_EXPIRES_AT, 'deleted', nowIso, nowIso));
  rows.set(EXPIRED_PUBLIC_ID, buildSampleRow(EXPIRED_PUBLIC_ID, EXPIRED_CREATED_AT, EXPIRED_EXPIRES_AT, 'expired', null, nowIso));

  const executed: PublicResultDatabaseQueryIntentName[] = [];
  const execute: PublicResultDatabaseQueryExecutor = async (
    descriptor: PublicResultDatabaseParameterizedQueryDescriptor
  ): Promise<PublicResultDatabaseQueryExecutionResult> => {
    executed.push(descriptor.intentName);
    if (descriptor.intentName !== 'read-active-public-result-by-public-id') return { rows: [], rowCount: 0 };
    const publicId = descriptor.values[0];
    if (typeof publicId !== 'string') return { rows: [], rowCount: 0 };
    const row = rows.get(publicId);
    return row === undefined ? { rows: [], rowCount: 0 } : { rows: [row], rowCount: 1 };
  };

  return {
    execute,
    executedQueryIntents: () => [...executed],
    rowCount: () => rows.size
  };
}

interface PublicResultLookupPageDryRunFakeExecutor {
  readonly execute: PublicResultDatabaseQueryExecutor;
  readonly executedQueryIntents: () => readonly PublicResultDatabaseQueryIntentName[];
  readonly rowCount: () => number;
}

function buildSampleRow(
  publicId: string,
  createdAt: string,
  expiresAt: string,
  status: PublicResultStorageStatus,
  deletedAt: string | null,
  updatedAtIso: string
): PublicResultDatabaseStorageAdapterRow {
  const deleteTokenHash = buildPublicResultDeleteTokenHash(DELETE_TOKEN);
  const dto = buildPublicResultDto(runCorridorsEngine(SAMPLE_ANSWERS), {
    resultId: publicId,
    createdAt,
    expiresAt,
    deleteTokenHash
  });
  const input: PublicResultStorageCreateInput = { publicId, dto, createdAt, expiresAt, deleteTokenHash };
  const row = buildDatabaseStorageAdapterImplementationSampleRow(input, updatedAtIso);
  return { ...row, status, deleted_at: deletedAt };
}

function withoutDryRunFlag(env: PublicResultStorageRuntimeEnvironment): PublicResultStorageRuntimeEnvironment {
  const { [PUBLIC_RESULT_LOOKUP_PAGE_DATABASE_DRY_RUN_ENV]: _removed, ...rest } = env;
  return rest;
}

function unique<T>(items: readonly T[]): readonly T[] {
  return [...new Set(items)];
}
